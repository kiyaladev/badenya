import { useEffect, useState } from 'react';
import { Image, Text } from 'react-native';
import { getUploadAccessUrl } from '@/services/upload.service';

export default function PrivateReceiptImage({ url }: { url: string }) {
  const [source, setSource] = useState<string>();
  useEffect(() => {
    let active = true;
    setSource(undefined);
    const load = () =>
      getUploadAccessUrl(url)
        .then(value => {
          if (active) setSource(value);
        })
        .catch(() => {
          if (active) setSource(undefined);
        });
    void load();
    const timer = setInterval(() => void load(), 90000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [url]);
  return source ? (
    <Image source={{ uri: source }} className="w-12 h-12 rounded mr-3" />
  ) : (
    <Text accessibilityLabel="Aperçu indisponible">📎</Text>
  );
}
