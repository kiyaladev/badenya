import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

export interface ImageInfo {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        "L'accès à la caméra est nécessaire pour prendre des photos.",
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
};

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        "L'accès à la galerie est nécessaire pour sélectionner des photos.",
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    return false;
  }
};

/**
 * Pick an image from the device's photo library
 */
export const pickImage = async (options?: {
  allowsMultipleSelection?: boolean;
  quality?: number;
  aspect?: [number, number];
}): Promise<ImageInfo[] | null> => {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: options?.allowsMultipleSelection || false,
      quality: options?.quality || 0.8,
      aspect: options?.aspect,
      allowsEditing: !options?.allowsMultipleSelection,
    });

    if (result.canceled) {
      return null;
    }

    const images: ImageInfo[] = [];

    for (const asset of result.assets) {
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      images.push({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: (fileInfo as { size?: number }).size,
      });
    }

    return images;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Erreur', "Impossible de sélectionner l'image");
    return null;
  }
};

/**
 * Take a photo with the device's camera
 */
export const takePhoto = async (options?: {
  quality?: number;
  aspect?: [number, number];
}): Promise<ImageInfo | null> => {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: options?.quality || 0.8,
      aspect: options?.aspect,
      allowsEditing: true,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);

    return {
      uri: asset.uri,
      name: asset.fileName || `photo_${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
      size: (fileInfo as { size?: number }).size,
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Erreur', 'Impossible de prendre la photo');
    return null;
  }
};

/**
 * Show action sheet to choose between camera and gallery
 */
export const showImagePicker = async (options?: {
  allowsMultipleSelection?: boolean;
  quality?: number;
  aspect?: [number, number];
}): Promise<ImageInfo[] | null> => {
  return new Promise(resolve => {
    Alert.alert(
      'Choisir une photo',
      'Sélectionnez une source',
      [
        {
          text: 'Appareil photo',
          onPress: async () => {
            const photo = await takePhoto(options);
            resolve(photo ? [photo] : null);
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            const images = await pickImage(options);
            resolve(images);
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true }
    );
  });
};

/**
 * Save image to local storage (app directory)
 * This is a simple local storage implementation
 */
export const saveImageLocally = async (
  imageUri: string,
  filename: string
): Promise<string | null> => {
  try {
    const directory = `${FileSystem.documentDirectory}uploads/`;

    // Create directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }

    const newPath = `${directory}${filename}`;

    // Copy file to app directory
    await FileSystem.copyAsync({
      from: imageUri,
      to: newPath,
    });

    return newPath;
  } catch (error) {
    console.error('Error saving image locally:', error);
    return null;
  }
};

/**
 * Delete image from local storage
 */
export const deleteImageLocally = async (imageUri: string): Promise<boolean> => {
  try {
    await FileSystem.deleteAsync(imageUri, { idempotent: true });
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Get image size
 */
export const getImageSize = async (uri: string): Promise<number | null> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return (fileInfo as { size?: number }).size || null;
  } catch (error) {
    console.error('Error getting image size:', error);
    return null;
  }
};

/**
 * Convert image to base64
 */
export const imageToBase64 = async (uri: string): Promise<string | null> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

export default {
  requestCameraPermissions,
  requestMediaLibraryPermissions,
  pickImage,
  takePhoto,
  showImagePicker,
  saveImageLocally,
  deleteImageLocally,
  getImageSize,
  imageToBase64,
};
