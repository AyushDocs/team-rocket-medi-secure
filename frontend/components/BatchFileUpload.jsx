"use client";

import { useState, useRef } from "react";
import { useWeb3 } from "@/context/Web3Context";
import { Upload, X, FileText, Image, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILES = 20;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function BatchFileUpload({ patientId, onUploadComplete }) {
  const { account } = useWeb3();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 50MB limit`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles.map(f => ({
      file: f,
      preview: null,
      status: "pending"
    }))]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!account) {
      toast.error("Please connect your wallet");
      return;
    }

    if (files.length === 0) {
      toast.error("No files selected");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach(({ file }) => {
        formData.append("files", file);
      });
      formData.append("patientId", patientId || "");
      formData.append("userAddress", account);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/files/batch`, {
        method: "POST",
        body: formData,
        headers: {
          "x-wallet-address": account
        }
      });

      const result = await response.json();

      if (result.success) {
        setFiles(prev => prev.map((f, i) => ({
          ...f,
          status: result.files[i]?.success ? "success" : "error",
          cid: result.files[i]?.cid
        })));
        toast.success(`Uploaded ${result.successCount} files successfully`);
        onUploadComplete?.(result);
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload files");
      setFiles(prev => prev.map(f => ({ ...f, status: "error" })));
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setUploadProgress({});
  };

  const successCount = files.filter(f => f.status === "success").length;
  const errorCount = files.filter(f => f.status === "error").length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Batch File Upload</h3>
        <div className="text-sm text-gray-500">
          {files.length} / {MAX_FILES} files
        </div>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors"
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600">
          Click to select files or drag and drop
        </p>
        <p className="text-sm text-gray-400 mt-1">
          PDF, Images, DICOM up to 50MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.dicom,.txt,.json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {file.file.type.includes("image") ? (
                  <Image className="w-8 h-8 text-blue-500" />
                ) : (
                  <FileText className="w-8 h-8 text-blue-500" />
                )}
                <div>
                  <p className="font-medium text-sm">{file.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.status === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {file.status === "pending" && (
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm">
            {successCount > 0 && (
              <span className="text-green-600">{successCount} uploaded</span>
            )}
            {errorCount > 0 && (
              <span className="text-red-600 ml-2">{errorCount} failed</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearAll}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Clear All
            </button>
            <button
              onClick={uploadFiles}
              disabled={uploading || !account}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : `Upload ${files.length} Files`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchFileUpload;