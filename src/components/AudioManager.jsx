import { useState, useEffect } from 'react';
import { Paper, Typography, TextField, Button, Stack, MenuItem, Select, InputLabel, FormControl, IconButton } from '@mui/material';
import { UploadFile, Download } from '@mui/icons-material';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set, onValue } from 'firebase/database';
import { storage, db } from '../firebase';
import { audioTemplate } from '../dataModels/audioTemplate';
import { downloadJson } from '../utils/downloadJson';

export default function AudioManager() {
  const [audioList, setAudioList] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [audioData, setAudioData] = useState({ ...audioTemplate });
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const audioDbRef = dbRef(db, 'audio/');
    onValue(audioDbRef, (snapshot) => {
      const data = snapshot.val() || {};
      setAudioList(Object.keys(data));
    });
  }, []);

  const handleAudioSelect = (key) => {
    if (key === 'new') {
      setAudioData({ ...audioTemplate });
      setSelectedKey('');
      return;
    }
    const entryRef = dbRef(db, `audio/${key}`);
    onValue(entryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAudioData(data);
        setSelectedKey(key);
      }
    }, { onlyOnce: true });
  };

  const handleChange = (field, value) => {
    setAudioData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (file) => {
    const fileRef = storageRef(storage, `audio/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error(error);
        alert('Upload failed.');
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setAudioData(prev => ({ ...prev, fileUrl: downloadURL }));
          alert('File uploaded successfully.');
        });
      }
    );
  };

  const handleSave = () => {
    const nameKey = audioData.name?.trim();
    if (!nameKey) {
      alert('Please enter a valid Name before saving.');
      return;
    }

    const newKey = nameKey;
    const audioToSave = { ...audioData, id: newKey };

    set(dbRef(db, `audio/${newKey}`), audioToSave)
      .then(() => {
        alert(`Audio "${audioToSave.name}" saved.`);
        setSelectedKey(newKey);
        if (!audioList.includes(newKey)) {
          setAudioList(prev => [...prev, newKey]);
        }
      })
      .catch(err => {
        console.error(err);
        alert('Failed to save audio.');
      });
  };

  const handleDownload = () => {
    downloadJson(audioData, `${audioData.name || 'Audio'}.audio.json`);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" gutterBottom>Audio Manager</Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Audio Entry</InputLabel>
        <Select value={selectedKey} label="Select Audio Entry" onChange={(e) => handleAudioSelect(e.target.value)}>
          {audioList.map(key => (
            <MenuItem key={key} value={key}>{key}</MenuItem>
          ))}
          <MenuItem value="new">➕ Create New Audio</MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={2}>
        <TextField
          label="Name"
          fullWidth
          value={audioData.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />

        <TextField
          label="Category"
          fullWidth
          value={audioData.category}
          onChange={(e) => handleChange('category', e.target.value)}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={audioData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />

        <TextField
          label="External Link (Optional)"
          fullWidth
          value={audioData.externalLink}
          onChange={(e) => handleChange('externalLink', e.target.value)}
        />

        <TextField
          label="Storage File URL"
          fullWidth
          value={audioData.fileUrl}
          InputProps={{ readOnly: true }}
        />

        <Button component="label" variant="outlined" startIcon={<UploadFile />}>
          Upload Audio File
          <input hidden type="file" accept="audio/*" onChange={(e) => handleFileUpload(e.target.files[0])} />
        </Button>

        {uploadProgress > 0 && <Typography variant="caption">Uploading: {uploadProgress.toFixed(0)}%</Typography>}

        {audioData.fileUrl && (
          <audio controls src={audioData.fileUrl} style={{ width: '100%' }}>
            Your browser does not support the audio element.
          </audio>
        )}

        <Stack direction="row" spacing={2}>
          <Button variant="contained" fullWidth startIcon={<Download />} onClick={handleDownload}>
            Download .audio JSON
          </Button>
          <Button variant="contained" color="success" fullWidth onClick={handleSave}>
            Save to Database
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
