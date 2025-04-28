'use client';

import { ChangeEvent, DragEvent, useCallback, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  FileUp,
  Upload,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface UploadResponse {
  message: string;
  fileName: string;
  fileSize: number;
  path: string | null;
  url: string | null;
}

const UploadReplayPage = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError('');

    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selectedFile = e.target.files?.[0] || null;
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (file: File | null) => {
    if (!file) return;

    // Check file type - accept only .replay files
    if (!file.name.toLowerCase().endsWith('.replay')) {
      setError('Only Rocket League replay files (.replay) are accepted');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Create FormData for the file
      const formData = new FormData();
      formData.append('file', file);

      // Replace with your actual API endpoint for file upload
      const response = await fetch('/api/upload-replay', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload replay file');
      }

      const responseData: UploadResponse = await response.json();
      console.log(
        `File uploaded successfully: ${JSON.stringify(responseData)}`
      );

      setUploadSuccess(true);
      setUploadedFileUrl(responseData.url);

      // No automatic redirect - user will use the "Go to Home" button instead
    } catch (err: unknown) {
      // Type guard for Error objects
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error uploading file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    // If upload was successful, don't allow removal
    if (uploadSuccess) return;

    setFile(null);
  };

  return (
    <div className="container flex min-h-screen items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Upload Replay File
          </CardTitle>
          <CardDescription>
            Upload your Rocket League replay file (.replay) to analyze
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploadSuccess && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="size-4 text-green-500" />
              <AlertTitle className="text-green-500">Success</AlertTitle>
              <AlertDescription>
                <p className="mb-2 font-semibold text-gray-800">
                  Your replay file was uploaded successfully!
                </p>
                {uploadedFileUrl && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium text-gray-900">File URL:</div>
                    <div className="mt-1 flex items-center">
                      <a
                        href={uploadedFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center break-all pr-2 text-xs text-blue-600 underline hover:text-blue-800"
                      >
                        {uploadedFileUrl}
                        <ExternalLink className="ml-1 inline-block size-3 shrink-0" />
                      </a>
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={'h-7 text-xs transition-all duration-300'}
                        onClick={() => {
                          navigator.clipboard.writeText(uploadedFileUrl || '');
                          setCopySuccess(true);
                          setTimeout(() => setCopySuccess(false), 2000);
                        }}
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle className="mr-1 size-3.5" />
                            Copied!
                          </>
                        ) : (
                          'Copy URL'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {file ? (
            <div className="mb-4 flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center">
                <FileUp className="mr-2 size-5 text-blue-500" />
                <div className="max-w-[220px] truncate">{file.name}</div>
              </div>
              {!uploadSuccess && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ) : (
            !uploadSuccess && (
              // This is just the part that needs to be fixed in UploadReplayPage.tsx
              // Replace the existing drop zone div with this accessible version

              <div
                className={`cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  const uploadInput = document.getElementById('file-upload');
                  if (uploadInput) {
                    uploadInput.click();
                  }
                }}
                onKeyDown={(e) => {
                  // Handle Enter or Space key to activate the file input
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const uploadInput = document.getElementById('file-upload');
                    if (uploadInput) {
                      uploadInput.click();
                    }
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Upload replay file"
              >
                <Upload className="mx-auto mb-3 size-10 text-gray-400" />
                <p className="mb-1 text-sm text-gray-600">
                  <span className="font-medium text-blue-600">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  Only Rocket League replay files (.replay) are accepted (max
                  10MB)
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".replay"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {!uploadSuccess ? (
            <>
              <Button variant="outline" onClick={() => router.push('/')}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={isUploading ? 'cursor-not-allowed opacity-70' : ''}
              >
                {isUploading ? 'Uploading...' : 'Upload Replay'}
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              className="ml-auto"
              onClick={() => router.push('/')}
            >
              Go to Home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default UploadReplayPage;
