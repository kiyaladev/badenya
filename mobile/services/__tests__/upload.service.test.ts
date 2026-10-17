import { Platform } from 'react-native';
jest.mock('react-native', () => ({ Platform: { OS: 'ios' }, Alert: { alert: jest.fn() } }));
import {
  uploadImage,
  imageToBase64,
  saveImageLocally,
  deleteImageLocally,
  getUploadAccessUrl,
} from '../upload.service';
import api from '../api';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    defaults: { baseURL: 'https://api.badenya.app/api/v1' },
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///data/user/0/app/files/',
  EncodingType: { Base64: 'base64' },
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 12345 })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('mockBase64String')),
}));

describe('UploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  describe('imageToBase64', () => {
    it('should read file as base64 string', async () => {
      const base64 = await imageToBase64('file:///photo.jpg');
      expect(base64).toBe('mockBase64String');
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file:///photo.jpg', {
        encoding: 'base64',
      });
    });

    it('should return null on read failure', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(
        new Error('File not found')
      );
      const base64 = await imageToBase64('file:///photo.jpg');
      expect(base64).toBeNull();
    });
  });

  describe('uploadImage', () => {
    it('should upload base64 image and return public URL', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: {
          data: {
            file: {
              url: 'https://api.badenya.app/uploads/img.jpg',
              filename: 'img.jpg',
              mimeType: 'image/jpeg',
              size: 12345,
            },
          },
        },
      });

      const result = await uploadImage(
        {
          uri: 'file:///photo.jpg',
          name: 'photo.jpg',
          type: 'image/jpeg',
        },
        { purpose: 'receipt', groupId: 'group-1' }
      );

      expect(api.post).toHaveBeenCalledWith('/uploads/image', {
        data: 'data:image/jpeg;base64,mockBase64String',
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        purpose: 'receipt',
        groupId: 'group-1',
      });
      expect(result.url).toBe('https://api.badenya.app/uploads/img.jpg');
    });

    it('should throw if server returns no file URL', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { data: {} },
      });

      await expect(
        uploadImage(
          {
            uri: 'file:///photo.jpg',
            name: 'photo.jpg',
            type: 'image/jpeg',
          },
          { purpose: 'avatar' }
        )
      ).rejects.toThrow('Le serveur n’a pas retourné l’URL du fichier');
    });
  });

  describe('saveImageLocally and deleteImageLocally', () => {
    it('should copy image to local upload directory', async () => {
      const savedPath = await saveImageLocally('file:///temp.jpg', 'saved.jpg');
      expect(savedPath).toBe('file:///data/user/0/app/files/uploads/saved.jpg');
      expect(FileSystem.copyAsync).toHaveBeenCalled();
    });

    it('should delete image locally', async () => {
      const success = await deleteImageLocally('file:///data/user/0/app/files/uploads/saved.jpg');
      expect(success).toBe(true);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        'file:///data/user/0/app/files/uploads/saved.jpg',
        { idempotent: true }
      );
    });
  });
});

it('requests a temporary link through the authenticated API and rejects external URLs', async () => {
  const filename = 'a'.repeat(32) + '.webp';
  (api.get as jest.Mock).mockResolvedValue({
    data: { data: { url: 'https://api.badenya.app/signed' } },
  });
  expect(await getUploadAccessUrl(`https://api.badenya.app/uploads/${filename}`)).toBe(
    'https://api.badenya.app/signed'
  );
  expect(api.get).toHaveBeenCalledWith(`/uploads/${filename}/access`);
  await expect(getUploadAccessUrl('https://evil.test/uploads/file.png')).rejects.toThrow(
    'Justificatif inaccessible'
  );
});
it('keeps browser blob images usable without native filesystem calls', async () => {
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  (FileSystem.copyAsync as jest.Mock).mockClear();
  expect(await saveImageLocally('blob:photo', 'photo.png')).toBe('blob:photo');
  expect(FileSystem.copyAsync).not.toHaveBeenCalled();
});
