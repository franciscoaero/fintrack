import { useState, useRef } from 'react';
import { getPresignedUrl, uploadToS3, processReceipt } from '../services/expenseService.js';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * ReceiptUpload — upload de comprovante com extração OCR.
 *
 * Props:
 *  - onDataExtracted(data): callback com dados extraídos { description, amount, date }
 *  - onError(message): callback de erro
 */
export default function ReceiptUpload({ onDataExtracted, onError }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function resetState() {
    setPreview(null);
    setFileName('');
    setError('');
    setUploading(false);
    setProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      const msg = 'Formato não suportado. Use JPEG ou PNG.';
      setError(msg);
      onError?.(msg);
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      const msg = 'Arquivo excede o tamanho máximo de 5 MB.';
      setError(msg);
      onError?.(msg);
      e.target.value = '';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setFileName(file.name);
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      // Step 1: Get presigned URL
      const presignResult = await getPresignedUrl(file.type, file.name);
      const { uploadUrl, receiptKey, upload_url, receipt_key } = presignResult?.data || {};
      const finalUploadUrl = uploadUrl || upload_url;
      const finalReceiptKey = receiptKey || receipt_key;

      if (!finalUploadUrl || !finalReceiptKey) {
        throw new Error('Falha ao obter URL de upload.');
      }

      // Step 2: Upload to S3
      await uploadToS3(finalUploadUrl, file, file.type);
      setUploading(false);

      // Step 3: Process OCR
      setProcessing(true);
      const ocrResult = await processReceipt(finalReceiptKey);
      const extracted = ocrResult?.data || {};

      setProcessing(false);
      onDataExtracted?.({
        description: extracted.description,
        amount: extracted.amount,
        date: extracted.date,
        receiptKey: extracted.receiptKey || extracted.receipt_key || finalReceiptKey,
      });

      resetState();
    } catch (err) {
      setUploading(false);
      setProcessing(false);
      const msg = 'Não foi possível extrair dados. Preencha manualmente.';
      setError(msg);
      onError?.(msg);
    }
  }

  const isLoading = uploading || processing;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Comprovante <span className="text-gray-400">(JPEG ou PNG, até 5 MB)</span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        disabled={isLoading}
        className="file:cursor-pointer block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Preview */}
      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt={`Pré-visualização: ${fileName}`}
            className="max-h-48 rounded-lg border border-gray-200 object-contain"
          />
          <p className="mt-1 text-xs text-gray-500">{fileName}</p>
        </div>
      )}

      {/* Upload button */}
      {preview && !isLoading && (
        <button
          type="button"
          onClick={handleUpload}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          Enviar e extrair dados
        </button>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
          <span>{uploading ? 'Enviando comprovante...' : 'Processando OCR...'}</span>
        </div>
      )}
    </div>
  );
}
