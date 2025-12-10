import { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadCardProps {
  onUpload: (file: File) => Promise<void>;
  previewUrl?: string | null;
  onClear?: () => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export function UploadCard({
  onUpload,
  previewUrl,
  onClear,
  className,
  accept = "image/*",
  maxSize = 10,
}: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please upload an image file';
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  if (previewUrl) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden border-2 border-border bg-card", className)}>
        <img
          src={previewUrl}
          alt="Uploaded drawing"
          className="w-full h-64 object-contain bg-muted/50"
        />
        {onClear && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onClear}
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
          <div className="flex items-center gap-2 text-accent">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Image uploaded successfully</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
        error && "border-destructive bg-destructive/5",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload drawing"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      
      <div className="flex flex-col items-center justify-center py-12 px-6">
        {isUploading ? (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-foreground font-medium">Uploading...</p>
          </>
        ) : (
          <>
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
              isDragging ? "bg-primary/20" : "bg-secondary"
            )}>
              <Upload className={cn(
                "w-8 h-8 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <p className="text-foreground font-medium mb-1">
              {isDragging ? "Drop your image here" : "Click or drag to upload"}
            </p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, or GIF up to {maxSize}MB
            </p>
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
