/**
 * File Upload Component Tests
 *
 * Tests for file upload patterns including drag-and-drop
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Simple file upload component for testing
const FileUpload = ({ onFileSelect, accept = 'image/*', maxSize = 5 * 1024 * 1024 }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [preview, setPreview] = React.useState(null);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `File size exceeds ${maxSize / (1024 * 1024)}MB limit`;
    }
    if (accept !== '*' && !file.type.match(accept.replace('*', '.*'))) {
      return 'Invalid file type';
    }
    return null;
  };

  const handleFile = (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }

    onFileSelect?.(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      data-testid="upload-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `2px dashed ${isDragging ? '#22c55e' : '#374151'}`,
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        background: isDragging ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
        transition: 'all 0.2s'
      }}
    >
      {preview ? (
        <img
          src={preview}
          alt="Preview"
          data-testid="preview-image"
          style={{ maxWidth: '200px', maxHeight: '200px' }}
        />
      ) : (
        <>
          <p data-testid="upload-text">
            {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
          </p>
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            data-testid="file-input"
            style={{ display: 'none' }}
          />
        </>
      )}

      {error && (
        <p data-testid="error-message" style={{ color: '#ef4444', marginTop: '12px' }}>
          {error}
        </p>
      )}
    </div>
  );
};

describe('FileUpload Component', () => {
  describe('Rendering', () => {
    test('renders upload zone', () => {
      render(<FileUpload />);

      expect(screen.getByTestId('upload-zone')).toBeInTheDocument();
    });

    test('renders upload text', () => {
      render(<FileUpload />);

      expect(screen.getByTestId('upload-text')).toHaveTextContent('Drag & drop');
    });

    test('renders file input', () => {
      render(<FileUpload />);

      expect(screen.getByTestId('file-input')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    test('changes text on drag over', () => {
      render(<FileUpload />);

      const zone = screen.getByTestId('upload-zone');

      fireEvent.dragOver(zone);

      expect(screen.getByTestId('upload-text')).toHaveTextContent('Drop file here');
    });

    test('reverts text on drag leave', () => {
      render(<FileUpload />);

      const zone = screen.getByTestId('upload-zone');

      fireEvent.dragOver(zone);
      fireEvent.dragLeave(zone);

      expect(screen.getByTestId('upload-text')).toHaveTextContent('Drag & drop');
    });

    test('handles file drop', () => {
      const handleSelect = jest.fn();
      render(<FileUpload onFileSelect={handleSelect} />);

      const zone = screen.getByTestId('upload-zone');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      fireEvent.drop(zone, {
        dataTransfer: { files: [file] }
      });

      expect(handleSelect).toHaveBeenCalledWith(file);
    });
  });

  describe('File Selection', () => {
    test('calls onFileSelect when file is selected', () => {
      const handleSelect = jest.fn();
      render(<FileUpload onFileSelect={handleSelect} />);

      const input = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      fireEvent.change(input, { target: { files: [file] } });

      expect(handleSelect).toHaveBeenCalledWith(file);
    });
  });

  describe('File Validation', () => {
    test('shows error for files exceeding size limit', () => {
      const handleSelect = jest.fn();
      render(<FileUpload onFileSelect={handleSelect} maxSize={1024} />);

      const zone = screen.getByTestId('upload-zone');
      const largeFile = new File(['x'.repeat(2048)], 'large.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 2048 });

      fireEvent.drop(zone, {
        dataTransfer: { files: [largeFile] }
      });

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(handleSelect).not.toHaveBeenCalled();
    });

    test('shows error for invalid file type', () => {
      const handleSelect = jest.fn();
      render(<FileUpload onFileSelect={handleSelect} accept="image/*" />);

      const zone = screen.getByTestId('upload-zone');
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      fireEvent.drop(zone, {
        dataTransfer: { files: [textFile] }
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid file type');
      expect(handleSelect).not.toHaveBeenCalled();
    });
  });

  describe('Preview', () => {
    test('shows preview for valid image', async () => {
      render(<FileUpload />);

      const zone = screen.getByTestId('upload-zone');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null,
        result: 'data:image/png;base64,test'
      };
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.drop(zone, {
        dataTransfer: { files: [file] }
      });

      // Trigger onload
      mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } });

      await waitFor(() => {
        expect(screen.getByTestId('preview-image')).toBeInTheDocument();
      });
    });
  });
});

describe('File Validation Utilities', () => {
  const validateFile = (file, options = {}) => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/*'] } = options;

    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    const isTypeValid = allowedTypes.some(type => {
      if (type === '*') return true;
      if (type.endsWith('/*')) {
        const category = type.replace('/*', '');
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isTypeValid) {
      errors.push('Invalid file type');
    }

    return { valid: errors.length === 0, errors };
  };

  test('accepts valid image files', () => {
    const file = { size: 1024, type: 'image/png' };
    const result = validateFile(file);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects files exceeding size limit', () => {
    const file = { size: 10 * 1024 * 1024, type: 'image/png' };
    const result = validateFile(file, { maxSize: 5 * 1024 * 1024 });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('File size exceeds 5MB limit');
  });

  test('rejects invalid file types', () => {
    const file = { size: 1024, type: 'application/pdf' };
    const result = validateFile(file, { allowedTypes: ['image/*'] });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid file type');
  });

  test('accepts any file type with wildcard', () => {
    const file = { size: 1024, type: 'application/pdf' };
    const result = validateFile(file, { allowedTypes: ['*'] });

    expect(result.valid).toBe(true);
  });

  test('handles null file', () => {
    const result = validateFile(null);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('No file provided');
  });
});
