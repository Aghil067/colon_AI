import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AssessmentCard from '../components/study/AssessmentCard';

export default function UploadPrediction() {
  const [status, setStatus] = useState(null);
  const [selection, setSelection] = useState(null);
  const [source, setSource] = useState('user-upload');
  const [sourceUrl, setSourceUrl] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const preview = selection?.preview;

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/status', { signal: controller.signal })
      .then(({ data }) => setStatus(data))
      .catch(() => { if (!controller.signal.aborted) setStatus({ image_classifier: 'offline' }); });
    return () => controller.abort();
  }, []);

  function selectImage(event) {
    const file = event.currentTarget.files[0];
    setError('');
    if (file?.size > 11.9 * 1024 ** 2) {
      event.currentTarget.value = '';
      setSelection(null);
      setError('Choose a file smaller than 12 MB.');
      return;
    }
    setSelection(file ? { file, preview: URL.createObjectURL(file) } : null);
  }

  async function submit(event) {
    event.preventDefault();
    if (!selection || busy) return;
    setBusy(true);
    setError('');
    const body = new FormData();
    body.append('image', selection.file);
    body.append('source', source);
    if (source === 'public-research') body.append('source_url', sourceUrl.trim());
    try {
      const { data } = await axios.post('/api/assessments', body);
      setCaseData(data);
      setSelection(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Check the server and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell">
      <header>
        <h1 className="page-title">New endoscopy assessment</h1>
        <p className="page-intro">Submit an authorized or public research image to create an assessment record.</p>
        <p className="mt-2 text-sm text-slate-600" role="status">
          {status?.image_classifier === 'ready' ? 'Kvasir v2 research classifier is available.'
            : status?.image_classifier === 'offline' ? 'The backend could not be reached.'
              : status ? 'Image classification is unavailable. Uploads, provenance and reviewer workflow are available.'
                : 'Checking classifier status…'} <Link to="/evidence" className="text-blue-700 underline">View model evidence</Link>
        </p>
      </header>
      {caseData ? <>
        {caseData.duplicate_of && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          This upload is byte-for-byte identical to{' '}
          <Link className="font-semibold underline" to={`/history?assessment=${caseData.duplicate_of}`}>assessment #{caseData.duplicate_of}</Link>.
        </p>}
        <AssessmentCard key={caseData.id} record={caseData} role="patient" onChange={setCaseData} />
        <button type="button" className="btn-secondary" onClick={() => setCaseData(null)}>Start another assessment</button>
      </> : <form onSubmit={submit} className="card panel-padding max-w-3xl space-y-5">
        <div>
          <label htmlFor="endoscopy-image" className="block font-semibold mb-2">Endoscopy image</label>
          <input id="endoscopy-image" type="file" accept="image/jpeg,image/png" required className="input-field min-w-0 file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf5f1] file:px-3 file:py-1.5 file:font-semibold file:text-[#17604e]"
            onChange={selectImage} disabled={busy} />
          <p className="mt-1 text-xs text-slate-500">JPEG or PNG · Up to 12 MB and 20 megapixels</p>
          {preview && <figure className="mt-4 w-fit max-w-full rounded-xl border border-slate-200 bg-slate-50 p-3">
            <img src={preview} alt="Preview of selected upload" className="max-h-56 max-w-full object-contain rounded-lg" />
            <figcaption className="mt-2 break-all text-xs text-slate-600">{selection.file.name}</figcaption>
          </figure>}
        </div>
        <div>
          <label htmlFor="image-source" className="block font-semibold mb-2">Image source</label>
          <select id="image-source" className="input-field" value={source} onChange={event => setSource(event.target.value)}>
            <option value="user-upload">User-supplied image</option>
            <option value="public-research">Public research dataset</option>
          </select>
        </div>
        {source === 'public-research' && <div>
          <label htmlFor="dataset-url" className="block font-semibold mb-2">Public dataset URL</label>
          <input id="dataset-url" className="input-field" type="url" required maxLength={500}
            value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} />
        </div>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button className="btn-primary" disabled={!selection || busy || status?.image_classifier === 'offline'}>
          {busy ? 'Processing image…' : 'Create assessment'}
        </button>
      </form>}
    </div>
  );
}
