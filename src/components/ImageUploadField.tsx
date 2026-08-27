import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, RefreshCw, Upload, Check, AlertCircle } from 'lucide-react';

interface ImageUploadFieldProps {
  id?: string;
  label?: string;
  value?: string;
  onChange: (base64OrUrl: string, file?: File) => void;
  aspectRatio?: 'square' | 'wide' | 'avatar';
  helperText?: string;
  required?: boolean;
  className?: string;
}

/**
 * Utility to compress and convert image file to optimized Base64 data URL
 * to avoid blowing up memory/storage for camera photos.
 */
export async function fileToBase64Optimized(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const result = readerEvent.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read file'));
        return;
      }

      // If svg or gif, keep as is
      if (file.type.includes('svg') || file.type.includes('gif')) {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG with good compression
        const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedBase64);
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Future Supabase Storage Upload Stub:
 * Ready to be connected when Supabase project credentials are provided.
 */
export async function uploadToSupabaseStorage(file: File, bucket = 'products'): Promise<string> {
  // When Supabase is enabled, this will upload directly to Supabase storage bucket
  // and return the public URL:
  /*
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(`${Date.now()}_${file.name}`, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicData.publicUrl;
  */
  return fileToBase64Optimized(file);
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  id,
  label,
  value,
  onChange,
  aspectRatio = 'square',
  helperText,
  required = false,
  className = '',
}) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64Optimized(file);
      onChange(base64, file);
    } catch (err: any) {
      console.error('Error processing image:', err);
      setErrorMsg('حدث خطأ أثناء قراءة الصورة.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input so selecting the same file triggers change
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleRemove = () => {
    onChange('', undefined);
    setErrorMsg(null);
  };

  const aspectClass =
    aspectRatio === 'wide'
      ? 'aspect-video'
      : aspectRatio === 'avatar'
      ? 'aspect-square max-w-[140px]'
      : 'aspect-4/3 max-h-56';

  return (
    <div id={id} className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {value && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <Check className="h-3 w-3" /> تم تحديد الصورة
            </span>
          )}
        </div>
      )}

      {/* Hidden native file inputs */}
      {/* 1. Gallery input */}
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 2. Direct Camera input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Container */}
      {value ? (
        /* Image Preview State */
        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900 group">
          <div className={`w-full ${aspectClass} flex items-center justify-center bg-slate-950/40`}>
            <img
              src={value}
              alt="معاينة الصورة"
              className="h-full w-full object-contain"
            />
          </div>

          {/* Action Overlay Bar */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-transparent p-3 pt-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-white shadow-xs transition active:scale-95"
                title="تغيير من الاستوديو"
              >
                <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                <span>الاستوديو</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 rounded-xl bg-white/90 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-white shadow-xs transition active:scale-95"
                title="التقاط بالكاميرا"
              >
                <Camera className="h-3.5 w-3.5 text-emerald-600" />
                <span>الكاميرا</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-600/90 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-rose-600 shadow-xs transition active:scale-95"
              title="حذف الصورة"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>حذف</span>
            </button>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-white gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
              <span className="text-xs font-bold">جاري معالجة الصورة...</span>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Select State */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
          }`}
        >
          {isProcessing ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-600">
              <RefreshCw className="h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-xs font-bold">جاري تحويل ومعالجة الصورة...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 text-slate-500">
                <Upload className="h-5 w-5 text-slate-600" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">
                  اختر صورة من جهازك أو التقطها فوراً
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {helperText || 'يدعم الصور المباشرة بصيغة JPG أو PNG مع ضغط فوري لتسريع التصفح'}
                </p>
              </div>

              {/* Two Direct Action Buttons */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-100 hover:border-slate-300 transition active:scale-95"
                >
                  <ImageIcon className="h-4 w-4 text-blue-600" />
                  <span>معرض الصور (Gallery)</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                >
                  <Camera className="h-4 w-4" />
                  <span>التقاط بالكاميرا (Camera)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
