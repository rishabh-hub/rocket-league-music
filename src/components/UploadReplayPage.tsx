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
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
  const [visibility, setVisibility] = useState<string>('public');
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Contextual feedback hook
  const { activePrompt, dismissPrompt, completePrompt, triggerFullFeedback } =
    useContextualFeedbackContext();

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
      setError(
        'That is not a .replay file. On Windows they are in Documents\\My Games\\Rocket League\\TAGame\\Demos.'
      );
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(
        `That replay is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 10MB.`
      );
      return;
    }

    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;

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
        throw new Error(
          errorData.message || 'The upload did not go through. Try again.'
        );
      }

      const responseData: UploadResponse = await response.json();

      setUploadSuccess(true);

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
        setError(
          'The upload did not go through. Check your connection and press Upload replay again — your file is still selected.'
        );
      }
      setUploadProgress(0);
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
    <div className="container max-w-md px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-medium tracking-tight">
            Upload a replay
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploadSuccess && (
            <Alert variant="success" className="mb-4">
              <CheckCircle className="size-4" />
              <AlertTitle>Uploaded</AlertTitle>
              <AlertDescription>Opening your match analysis…</AlertDescription>
            </Alert>
          )}

          {file ? (
            <div className="mb-4 flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center">
                <FileUp className="mr-2 size-5 text-primary" />
                <div className="max-w-[220px] truncate">{file.name}</div>
              </div>
              {!uploadSuccess && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ) : (
            !uploadSuccess && (
              <div
                className={`cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition-colors duration-instant ease-standard ${
                  isDragging
                    ? 'border-primary bg-muted/50'
                    : 'border-muted hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  // Handle Enter or Space key to activate the file input
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Upload replay file"
              >
                <Upload className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="mb-1 text-sm">
                  <span className="font-medium text-primary">
                    {isDragging ? 'Drop it' : 'Choose a replay'}
                  </span>{' '}
                  {!isDragging && 'or drag one here'}
                </p>
                <p className="text-xs text-muted-foreground">
                  .replay files, up to 10MB
                </p>
                <input
                  id="file-upload"
                  ref={fileInputRef}
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
              <label
                htmlFor="visibility"
                className="mb-2 block text-sm font-medium"
              >
                Visibility on ballchasing.com
              </label>
              <Select
                value={visibility}
                onValueChange={setVisibility}
                disabled={isUploading}
              >
                <SelectTrigger id="visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Public replays can appear in the showcase.
              </p>
            </div>
          )}

          {/* Processing info */}
          {!uploadSuccess && (
            <p className="mt-4 text-xs text-muted-foreground">
              Your replay goes to ballchasing.com to be parsed — usually 1–2
              minutes.
            </p>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm">
                <Loader2 className="mr-2 size-4 animate-spin" />
                <span>Uploading…</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {!uploadSuccess ? (
            <>
              <Button variant="outline" onClick={() => router.push('/')}>
                Back
              </Button>
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? 'Uploading…' : 'Upload replay'}
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              className="ml-auto"
              onClick={() => router.push('/')}
            >
              Back to home
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Contextual Feedback Prompt */}
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
};

export default UploadReplayPage;
