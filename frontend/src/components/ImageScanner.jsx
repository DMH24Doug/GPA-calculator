import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { parseOCRRows, parseOCRText } from "../utils/ocrParser";

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 16V5" strokeLinecap="round" />
      <path d="m8 9 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" strokeLinecap="round" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7V5h2M20 7V5h-2M4 17v2h2M20 17v2h-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12h10" strokeLinecap="round" />
      <path d="M9 9h6v6H9z" strokeLinejoin="round" />
    </svg>
  );
}

function groupWordsIntoRows(words = []) {
  const validWords = words
    .filter((word) => word?.text?.trim())
    .map((word) => ({
      text: word.text.trim(),
      x0: word.bbox?.x0 ?? 0,
      x1: word.bbox?.x1 ?? 0,
      y0: word.bbox?.y0 ?? 0,
      y1: word.bbox?.y1 ?? 0,
    }))
    .sort((left, right) => {
      const topDifference = left.y0 - right.y0;

      if (Math.abs(topDifference) > 8) {
        return topDifference;
      }

      return left.x0 - right.x0;
    });

  const rows = [];

  validWords.forEach((word) => {
    const wordMiddle = (word.y0 + word.y1) / 2;
    const existingRow = rows.find((row) => {
      const rowMiddle = row.middleY;
      const rowHeight = Math.max(row.height, word.y1 - word.y0, 1);

      return Math.abs(rowMiddle - wordMiddle) <= rowHeight * 0.55;
    });

    if (!existingRow) {
      rows.push({
        words: [word],
        topY: word.y0,
        bottomY: word.y1,
        middleY: wordMiddle,
        height: Math.max(word.y1 - word.y0, 1),
      });
      return;
    }

    existingRow.words.push(word);
    existingRow.topY = Math.min(existingRow.topY, word.y0);
    existingRow.bottomY = Math.max(existingRow.bottomY, word.y1);
    existingRow.middleY = (existingRow.topY + existingRow.bottomY) / 2;
    existingRow.height = Math.max(existingRow.bottomY - existingRow.topY, 1);
  });

  return rows
    .map((row) =>
      row.words
        .sort((left, right) => left.x0 - right.x0)
        .map((word) => word.text)
        .join(" "),
    )
    .filter(Boolean);
}

function ImageScanner({ onImportSubjects }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState("");
  const [detectedSubjects, setDetectedSubjects] = useState([]);
  const [scanError, setScanError] = useState("");
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleFileSelection = (file) => {
    if (!file) {
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setSelectedImage(file);
    setImagePreviewUrl(nextPreviewUrl);
    setDetectedSubjects([]);
    setOcrText("");
    setScanError("");
    setProgress(0);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files?.[0]);
  };

  const preprocessImageForOcr = async (file) => {
    const imageUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise((resolve, reject) => {
        const nextImage = new Image();
        nextImage.onload = () => resolve(nextImage);
        nextImage.onerror = reject;
        nextImage.src = imageUrl;
      });

      const scale = 2.5;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        return file;
      }

      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const grayscale = red * 0.299 + green * 0.587 + blue * 0.114;
        const boosted = grayscale > 185 ? 255 : grayscale < 150 ? 0 : grayscale;

        data[index] = boosted;
        data[index + 1] = boosted;
        data[index + 2] = boosted;
      }

      context.putImageData(imageData, 0, 0);

      return await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob ?? file),
          "image/png",
          1,
        );
      });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  };

  const handleScan = async () => {
    if (!selectedImage) {
      return;
    }

    setIsScanning(true);
    setScanError("");
    setDetectedSubjects([]);
    setProgress(0);

    try {
      const processedImage = await preprocessImageForOcr(selectedImage);

      const result = await Tesseract.recognize(processedImage, "eng", {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(Math.round((message.progress ?? 0) * 100));
          }
        },
      });

      const extractedText = result.data.text ?? "";
      const rowTexts = groupWordsIntoRows(result.data.words ?? []);
      const parsedSubjects =
        rowTexts.length > 0 ? parseOCRRows(rowTexts) : parseOCRText(extractedText);

      setOcrText(
        rowTexts.length > 0 ? rowTexts.join("\n") : extractedText,
      );
      setDetectedSubjects(parsedSubjects);

      if (parsedSubjects.length === 0) {
        setScanError(
          "No clear course-code and grade pairs were detected. Try a sharper image or crop closer to the table.",
        );
      }
    } catch {
      setScanError(
        "The scan could not be completed. Try another image or refresh and scan again.",
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = () => {
    if (detectedSubjects.length === 0) {
      return;
    }

    onImportSubjects(detectedSubjects);
  };

  return (
    <section className="bg-transparent">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Image Scanner
        </p>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Scan a results image
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Upload a screenshot or photo of your results. The app will try to read
          transcript text and detect course codes plus grades for quick import.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-lg border border-dashed p-5 transition ${
            isDragging
              ? "border-slate-500 bg-slate-200 dark:border-slate-500 dark:bg-slate-700"
              : "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFileSelection(event.target.files?.[0])}
          />

          <div className="flex h-full min-h-72 flex-col items-center justify-center gap-4 text-center">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Selected grade sheet"
                className="max-h-80 rounded-md border border-slate-300 object-contain dark:border-slate-600"
              />
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-sm font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  OCR
                </div>
                <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                  Drag and drop an image here
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  PNG, JPG, or a clean screenshot of your transcript table
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 border border-slate-300 bg-transparent px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <UploadIcon />
                Choose image
              </button>
              <button
                type="button"
                onClick={handleScan}
                disabled={!selectedImage || isScanning}
                className="inline-flex items-center gap-1.5 border border-slate-900 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-400 dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:border-slate-700 dark:disabled:bg-slate-700"
              >
                <ScanIcon />
                {isScanning ? "Scanning..." : "Scan grades"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Scan Results</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Review the detected rows before loading them into your GPA list.
            </p>
          </div>

          {isScanning ? (
            <div className="space-y-3">
              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-slate-700 transition-all dark:bg-slate-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Reading image... {progress}%
              </p>
            </div>
          ) : null}

          {scanError ? (
            <div className="rounded-md border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
              {scanError}
            </div>
          ) : null}

          {detectedSubjects.length > 0 ? (
            <>
              <div className="max-h-72 overflow-auto rounded-md border border-slate-300 dark:border-slate-700">
                <table className="min-w-full text-left text-sm text-slate-700 dark:text-slate-100">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.15em] text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detectedSubjects.map((subject) => (
                      <tr key={subject.id} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">
                          {subject.courseCode}
                        </td>
                        <td className="px-4 py-3">
                          {subject.courseName || "Detected from OCR"}
                        </td>
                        <td className="px-4 py-3">{subject.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleImport}
                className="w-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Import {detectedSubjects.length} detected subjects
              </button>
            </>
          ) : (
            <div className="rounded-md border border-slate-300 bg-slate-100 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300">
              Your detected subjects will appear here after scanning.
            </div>
          )}

          {ocrText ? (
            <details className="rounded-md border border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-700">
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">
                View raw OCR text
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600 dark:text-slate-300">
                {ocrText}
              </pre>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default ImageScanner;
