import { supabase } from './supabase'
import { Product, ProductFormData, ProductFilters } from '../types/product'
import { detectInAppBrowser } from '../utils/browserDetection'
import { createTimeoutPromise, retryWithBackoff, getInAppOptimizationSettings } from '../utils/inAppOptimization'
import { shouldBypassStorageUpload, prepareImageForDatabase } from '../utils/inAppImageUtils'

export const productService = {
  // 상품 목록 조회
  async getProducts(filters?: ProductFilters): Promise<{ data: Product[] | null; error: string | null }> {
    try {
      let query = supabase.from('products').select('*').order('id', { ascending: false })

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      if (filters?.is_soldout !== undefined) {
        query = query.eq('is_soldout', filters.is_soldout)
      }

      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id)
      }

      const { data, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: '상품 목록을 가져오는 중 오류가 발생했습니다.' }
    }
  },

  // 상품 생성 (카카오톡 최적화)
  async createProduct(productData: ProductFormData, storeId: number): Promise<{ data: Product | null; error: string | null }> {
    const browserInfo = detectInAppBrowser();
    const settings = getInAppOptimizationSettings();
    
    console.log('상품 생성 시작:', {
      browser: browserInfo.browser,
      isInApp: browserInfo.isInApp,
      hasImage: !!productData.image,
      imageSize: productData.image ? (productData.image.size / 1024 / 1024).toFixed(2) + 'MB' : 'none',
      settings
    });

    try {
      if (!storeId) {
        return { data: null, error: '점포가 선택되지 않았습니다.' }
      }

      const price = Number(productData.price)
      const quantity = Number(productData.quantity)
      if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
        return { data: null, error: '가격/수량이 올바르지 않습니다.' }
      }

      let imageUrl: string | null = null
      let imageBase64Data: any = null // Base64 데이터 보관용

      // 이미지 업로드 (카카오톡 최적화)
      if (productData.image) {
        console.log('이미지 업로드 시작...');
        
        // 파일 크기 체크
        if (productData.image.size > settings.maxFileSize) {
          return { 
            data: null, 
            error: `파일이 너무 큽니다. ${Math.round(settings.maxFileSize / 1024 / 1024)}MB 이하로 선택해주세요.` 
          };
        }

        // 🟬 인앱브라우저에서 Storage 업로드 우회 여부 확인
        if (shouldBypassStorageUpload()) {
          console.log('🟬 인앱브라우저 Storage 우회 모드: Base64로 DB 직접 저장');
          
          try {
            imageBase64Data = await prepareImageForDatabase(productData.image);
            console.log('✅ Base64 변환 성공:', {
              size: (imageBase64Data.size / 1024 / 1024).toFixed(2) + 'MB',
              mimeType: imageBase64Data.mimeType
            });
          } catch (error) {
            console.error('❌ Base64 변환 실패:', error);
            return { 
              data: null, 
              error: `이미지 처리에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
            };
          }
        } else {
          // 일반적인 Storage 업로드 (기존 코드)
          const uploadImageWithRetry = async (): Promise<string> => {
            const fileExt = productData.image!.name.split('.').pop() || 'jpg'
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
            const filePath = `products/${fileName}`

            // 카카오톡 인앱브라우저 전용 업로드 옵션
            const uploadOptions: any = {
              contentType: productData.image!.type,
              cacheControl: '3600',
              upsert: false,
            };

            // 카카오톡에서는 더 단순한 업로드 방식 사용
            if (browserInfo.browser === 'kakao') {
              uploadOptions.duplex = undefined; // 중복 방지
              uploadOptions.metadata = undefined; // 메타데이터 제거
            }

            console.log('Supabase 업로드 시도:', { filePath, size: productData.image!.size, options: uploadOptions });

            // Storage 업로드를 완전한 Promise로 변환
            const uploadQuery = supabase.storage
              .from('product-images')
              .upload(filePath, productData.image!, uploadOptions);
            
            const uploadPromise = Promise.resolve(uploadQuery);

            // 타임아웃 적용
            const uploadResponse = await createTimeoutPromise(
              uploadPromise,
              settings.uploadTimeout,
              '이미지 업로드 시간이 초과되었습니다. 네트워크를 확인하고 다시 시도해주세요.'
            );

            if (uploadResponse.error) {
              console.error('업로드 에러:', uploadResponse.error);
              throw new Error(`이미지 업로드 실패: ${uploadResponse.error.message || uploadResponse.error}`);
            }

            console.log('업로드 성공, Public URL 생성...');

            const { data: pub } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath);

            if (!pub?.publicUrl) {
              throw new Error('이미지 URL 생성에 실패했습니다.');
            }

            console.log('Public URL 생성 완료:', pub.publicUrl);
            return pub.publicUrl;
          };

          try {
            // 재시도 로직 적용
            imageUrl = await retryWithBackoff(uploadImageWithRetry, settings.maxRetries);
          } catch (uploadError) {
            console.error('이미지 업로드 최종 실패:', uploadError);
            return { 
              data: null, 
              error: `이미지 업로드에 실패했습니다: ${uploadError instanceof Error ? uploadError.message : '알 수 없는 오류'}` 
            };
          }
        }
      }

      console.log('상품 데이터 DB 저장 시작...');

      // DB 저장
      const insertData: any = {
        store_id: storeId,
        name: productData.name?.trim(),
        price,
        quantity,
        image_url: imageUrl,
      }
      
      // Base64 데이터가 있으면 추가
      if (imageBase64Data) {
        insertData.image_base64 = imageBase64Data.base64
        insertData.image_mime_type = imageBase64Data.mimeType
        insertData.image_original_name = imageBase64Data.originalName
        console.log('🟬 Base64 이미지 데이터 DB에 포함')
      }

      console.log('Insert 데이터:', {
        ...insertData,
        image_base64: insertData.image_base64 ? `[Base64 데이터 ${(imageBase64Data?.size || 0 / 1024 / 1024).toFixed(2)}MB]` : undefined
      });

      const dbInsertWithRetry = async () => {
        // PostgrestBuilder를 완전한 Promise로 변환
        const insertQuery = supabase
          .from('products')
          .insert(insertData)
          .select()
          .single();
        
        const insertPromise = Promise.resolve(insertQuery);

        // 인앱브라우저 최적화된 타임아웃 사용
        const dbTimeout = settings.dbTimeout || 15000;
        
        return await createTimeoutPromise(
          insertPromise,
          dbTimeout,
          `DB 저장 시간이 초과되었습니다. (타임아웃: ${dbTimeout/1000}초)`
        );
      };

      const { data, error } = await retryWithBackoff(dbInsertWithRetry, 2);

      if (error) {
        console.error('DB 저장 에러:', error);
        return { data: null, error: `상품 저장 실패: ${error.message}` }
      }

      console.log('상품 생성 완료:', data);
      return { data, error: null }

    } catch (error) {
      console.error('상품 생성 전체 오류:', error)
      
      let errorMessage = '상품 등록 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // 카카오톡 특화 에러 메시지
      if (browserInfo.browser === 'kakao') {
        errorMessage += '\n\n💡 카카오톡에서 문제가 지속되면 외부 브라우저(Chrome, Safari)를 사용해보세요.';
      }
      
      return { data: null, error: errorMessage }
    }
  },

  // 상품 수정 (카카오톡 최적화)
  async updateProduct(id: number, productData: Partial<ProductFormData>): Promise<{ data: Product | null; error: string | null }> {
    const browserInfo = detectInAppBrowser();
    const settings = getInAppOptimizationSettings();
    
    console.log('상품 수정 시작:', { id, browser: browserInfo.browser });

    try {
      const updateData: Record<string, any> = {}
      if (productData.name !== undefined) updateData.name = productData.name?.trim()
      if (productData.price !== undefined) {
        const price = Number(productData.price)
        if (!Number.isFinite(price)) return { data: null, error: '가격이 올바르지 않습니다.' }
        updateData.price = price
      }
      if (productData.quantity !== undefined) {
        const quantity = Number(productData.quantity)
        if (!Number.isFinite(quantity)) return { data: null, error: '수량이 올바르지 않습니다.' }
        updateData.quantity = quantity
      }

      // 새 이미지 업로드
      if (productData.image) {
        if (productData.image.size > settings.maxFileSize) {
          return { 
            data: null, 
            error: `파일이 너무 큽니다. ${Math.round(settings.maxFileSize / 1024 / 1024)}MB 이하로 선택해주세요.` 
          };
        }

        const uploadImageWithRetry = async (): Promise<string> => {
          const fileExt = productData.image!.name.split('.').pop() || 'jpg'
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
          const filePath = `products/${fileName}`

          const uploadOptions: any = {
            contentType: productData.image!.type,
            cacheControl: '3600',
            upsert: false,
          };

          if (browserInfo.browser === 'kakao') {
            uploadOptions.duplex = undefined;
            uploadOptions.metadata = undefined;
          }

          const uploadQuery = supabase.storage
            .from('product-images')
            .upload(filePath, productData.image!, uploadOptions);
          
          const uploadPromise = Promise.resolve(uploadQuery);

          const uploadResponse = await createTimeoutPromise(
            uploadPromise,
            settings.uploadTimeout,
            '이미지 업로드 시간이 초과되었습니다.'
          );

          if (uploadResponse.error) {
            throw new Error(`이미지 업로드 실패: ${uploadResponse.error.message || uploadResponse.error}`);
          }

          const { data: pub } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          if (!pub?.publicUrl) {
            throw new Error('이미지 URL 생성에 실패했습니다.');
          }

          return pub.publicUrl;
        };

        try {
          updateData.image_url = await retryWithBackoff(uploadImageWithRetry, settings.maxRetries);
        } catch (uploadError) {
          return { 
            data: null, 
            error: `이미지 업로드에 실패했습니다: ${uploadError instanceof Error ? uploadError.message : '알 수 없는 오류'}` 
          };
        }
      }

      const updateWithRetry = async () => {
        // PostgrestBuilder를 완전한 Promise로 변환
        const updateQuery = supabase
          .from('products')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        const updatePromise = Promise.resolve(updateQuery);

        return await createTimeoutPromise(
          updatePromise,
          15000,
          'DB 업데이트 시간이 초과되었습니다.'
        );
      };

      const { data, error } = await retryWithBackoff(updateWithRetry, 2);

      if (error) {
        return { data: null, error: `상품 수정 실패: ${error.message}` }
      }

      return { data, error: null }
    } catch (error) {
      console.error('상품 수정 전체 오류:', error)
      
      let errorMessage = '상품 수정 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (browserInfo.browser === 'kakao') {
        errorMessage += '\n\n💡 카카오톡에서 문제가 지속되면 외부 브라우저를 사용해보세요.';
      }
      
      return { data: null, error: errorMessage }
    }
  },

  // 상품 삭제 (타임아웃 적용)
  async deleteProduct(id: number): Promise<{ error: string | null }> {
    try {
      const deleteWithRetry = async (): Promise<void> => {
        // 참조 여부 확인 - PostgrestBuilder를 완전한 Promise로 변환
        const checkQuery = supabase
          .from('order_items')
          .select('id, order_id')
          .eq('product_id', id);
        
        const checkPromise = Promise.resolve(checkQuery);

        const checkResponse = await createTimeoutPromise(
          checkPromise,
          10000,
          '관련 데이터 확인 시간이 초과되었습니다.'
        );

        if (checkResponse.error) {
          throw new Error(`관련 데이터 확인 실패: ${checkResponse.error.message}`);
        }

        if (checkResponse.data && checkResponse.data.length > 0) {
          const deleteOrderItemsQuery = supabase
            .from('order_items')
            .delete()
            .eq('product_id', id);
          
          const deleteOrderItemsPromise = Promise.resolve(deleteOrderItemsQuery);

          const deleteOrderItemsResponse = await createTimeoutPromise(
            deleteOrderItemsPromise,
            10000,
            '관련 주문 항목 삭제 시간이 초과되었습니다.'
          );

          if (deleteOrderItemsResponse.error) {
            throw new Error(`관련 주문 항목 삭제 실패: ${deleteOrderItemsResponse.error.message}`);
          }
        }

        const deleteProductQuery = supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        const deleteProductPromise = Promise.resolve(deleteProductQuery);

        const deleteProductResponse = await createTimeoutPromise(
          deleteProductPromise,
          10000,
          '상품 삭제 시간이 초과되었습니다.'
        );

        if (deleteProductResponse.error) {
          if ((deleteProductResponse.error as any).code === '23503') {
            throw new Error('아직 이 상품을 참조하는 주문이 있습니다.');
          }
          throw new Error(`상품 삭제 실패: ${deleteProductResponse.error.message}`);
        }
      };

      await retryWithBackoff(deleteWithRetry, 2);
      return { error: null };

    } catch (error) {
      let errorMessage = '상품 삭제 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return { error: errorMessage };
    }
  },

  // 품절 상태 토글 (타임아웃 적용)
  async toggleSoldOut(id: number, isSoldOut: boolean): Promise<{ error: string | null }> {
    try {
      const toggleWithRetry = async (): Promise<void> => {
        // PostgrestBuilder를 완전한 Promise로 변환
        const toggleQuery = supabase
          .from('products')
          .update({ is_soldout: isSoldOut })
          .eq('id', id);
        
        const togglePromise = Promise.resolve(toggleQuery);

        const response = await createTimeoutPromise(
          togglePromise,
          10000,
          '상품 상태 변경 시간이 초과되었습니다.'
        );

        if (response.error) {
          throw new Error(`상품 상태 변경 실패: ${response.error.message}`);
        }
      };

      await retryWithBackoff(toggleWithRetry, 2);
      return { error: null }
    } catch (error) {
      let errorMessage = '상품 상태 변경 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return { error: errorMessage }
    }
  },
}
