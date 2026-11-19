import { useEffect, useState } from 'react';
import axios from 'axios';

export default function PrivateImage({ url, alt }) {
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl;
    if (url) {
      axios.get(url, { responseType: 'blob', signal: controller.signal })
        .then(({ data }) => {
          if (controller.signal.aborted) return;
          objectUrl = URL.createObjectURL(data);
          setLoaded({ url, objectUrl });
        })
        .catch(() => {
          if (!controller.signal.aborted) setLoaded({ url, objectUrl: null });
        });
    }
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return loaded?.url === url && loaded?.objectUrl
    ? <img src={loaded.objectUrl} alt={alt} className="aspect-[4/3] w-full bg-slate-100 object-contain rounded-xl" />
    : <p className="aspect-[4/3] grid place-content-center rounded-xl bg-slate-100 text-sm text-slate-500">
        {!url || loaded?.url === url ? 'Image unavailable' : 'Loading image…'}
      </p>;
}
