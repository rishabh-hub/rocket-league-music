// ABOUTME: Client component for uploading Rocket League replay files.
// ABOUTME: Handles drag-and-drop, validation, progress tracking, and redirect to processing page.
'use client';

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  CheckCircle,
  FileUp,
  Upload,
  X,
  Loader2,
  Info,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useContextualFeedbackContext } from '@/contexts/ContextualFeedbackContext';
import { ContextualPrompt } from '@/components/feedback/ContextualPrompt';

interface UploadResponse {
  message: string;
  fileName: string;
  fileSize: number;
  path: string | null;
  url: string | null;
  replayId?: string; // New field for the DB record ID
  status?: string; // New field for the processing status
}

const UploadReplayPage = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<string>('public');
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Contextual feedback hook
  const {
    activePrompt,
    dismissPrompt,
    completePrompt,
    triggerReplayUploadSuccess,
    triggerErrorRecovery,
    triggerFullFeedback,
  } = useContextualFeedbackContext();

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
    setUploadProgress(0);

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Simulate progress for better UX (actual progress is not available from fetch API)
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 5;
        if (newProgress >= 90) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return 90; // Hold at 90% until complete
        }
        return newProgress;
      });
    }, 300);

    try {
      // Create FormData for the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('visibility', visibility); // Add visibility parameter for ballchasing.com

      // Upload to our API endpoint (which now handles both Supabase and ballchasing)
      const response = await fetch('/api/upload-replay', {
        method: 'POST',
        body: formData,
      });

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setUploadProgress(100);

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

      // Trigger contextual feedback after upload success
      triggerReplayUploadSuccess();

      // After a short delay to show success, redirect to the replay details page
      // to show processing status
      if (responseData.replayId) {
        setTimeout(() => {
          router.push(`/replays/${responseData.replayId}`);
        }, 1500);
      }
    } catch (err: unknown) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Type guard for Error objects
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error uploading file');
      }
      setUploadProgress(0);

      // Trigger error recovery feedback after user has time to process the error
      setTimeout(() => {
        triggerErrorRecovery();
      }, 5000);
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
            Upload your Rocket League replay file for analysis on
            ballchasing.com
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
            <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CheckCircle className="size-4 text-green-500 dark:text-green-400" />
              <AlertTitle className="text-green-500 dark:text-green-400">
                Success
              </AlertTitle>
              <AlertDescription>
                <p className="mb-2 font-semibold">
                  Your replay file was uploaded successfully!
                </p>
                <p className="text-sm">Redirecting to processing page...</p>
                <div className="mt-2">
                  <Progress value={100} className="h-1" />
                </div>
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
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ) : (
            !uploadSuccess && (
              <div
                className={`cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-muted/50'
                    : 'border-muted hover:border-primary/50'
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
                <Upload className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="mb-1 text-sm">
                  <span className="font-medium text-primary">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
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

          {/* Visibility option for ballchasing.com */}
          {!uploadSuccess && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium">
                Replay Visibility on ballchasing.com
              </label>
              <Select
                value={visibility}
                onValueChange={setVisibility}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    Public (Anyone can find and view)
                  </SelectItem>
                  <SelectItem value="unlisted">
                    Unlisted (Only accessible with link)
                  </SelectItem>
                  <SelectItem value="private">
                    Private (Only you can view)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Processing info */}
          {!uploadSuccess && (
            <Alert className="mt-4 bg-muted">
              <Info className="size-4" />
              <AlertTitle>Processing Information</AlertTitle>
              <AlertDescription>
                <p className="text-xs text-muted-foreground mt-1">
                  After uploading, your replay will be sent to ballchasing.com
                  for processing. This may take 1-2 minutes depending on the
                  file size.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span>Uploading replay file...</span>
                </div>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
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
              onClick={() => {
                if (uploadedFileUrl) {
                  router.push('/');
                }
              }}
            >
              Go to Home
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Contextual Feedback Prompt */}
      {activePrompt && (
        <ContextualPrompt
          context={activePrompt.context}
          message={activePrompt.message}
          onDismiss={dismissPrompt}
          onOpenFullFeedback={() => {
            // Trigger the global FeedbackWidget to open with the contextual context
            if (activePrompt) {
              triggerFullFeedback(activePrompt.context);
            }
            completePrompt();
          }}
        />
      )}
    </div>
  );
};

export default UploadReplayPage;
