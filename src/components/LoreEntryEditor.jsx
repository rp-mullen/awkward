import { useState, useEffect } from 'react';
import {
  Paper, Typography, Stack, TextField, Grid, Button,
  Box, Chip, IconButton, InputBase
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

export default function LoreEditor() {
  const [loreList, setLoreList] = useState({});
  const [selectedKey, setSelectedKey] = useState('');
  const [lore, setLore] = useState({
    title: '',
    summary: '',
    fullText: '',
    tags: [],
    uid: ''
  });
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    const loreRef = ref(db, 'lore/');
    onValue(loreRef, (snapshot) => {
      const data = snapshot.val() || {};
      setLoreList(data);
    });
  }, []);

  const handleLoreSelect = (key) => {
    const entry = loreList[key];
    if (entry) {
      setLore({
        title: entry.title || '',
        summary: entry.summary || '',
        fullText: entry.fullText || '',
        tags: entry.tags || [],
        uid: entry.uid || ''
      });
      setSelectedKey(key);
    }
  };

  const handleChange = (field, value) => {
    setLore(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !lore.tags.includes(trimmed)) {
      setLore(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setLore(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleNewEntry = () => {
    setLore({
      title: '',
      summary: '',
      fullText: '',
      tags: [],
      uid: ''
    });
    setSelectedKey('');
  };

  const saveLoreToFirebase = () => {
    if (!lore.title) {
      alert('Please enter a title.');
      return;
    }

    const loreKey = lore.title;
    const exists = !!loreList[loreKey];

    const proceedToSave = () => {
      const loreToSave = { ...lore, uid: lore.uid || uuidv4() };
      const loreRef = ref(db, `lore/${loreKey}`);

      set(loreRef, loreToSave)
        .then(() => {
          alert(`Lore "${lore.title}" saved successfully.`);
          setSelectedKey(loreKey);
        })
        .catch(err => {
          console.error(err);
          alert('Failed to save lore.');
        });
    };

    if (exists && loreKey !== selectedKey) {
      const confirmOverwrite = window.confirm(`A lore entry titled "${loreKey}" already exists. Overwrite it?`);
      if (!confirmOverwrite) return;
    }

    proceedToSave();
  };

  const filteredLoreKeys = Object.keys(loreList).filter(key => {
    const matchesSearch = key.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !filterTag || (loreList[key]?.tags || []).includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(Object.values(loreList).flatMap(l => l.tags || [])));

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        m: 0,
        width: '100%',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        maxWidth: '1200px',
        marginInline: 'auto'
      }}
    >
      {/* Sidebar */}
      <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
        <Typography variant="h6" gutterBottom>Lore Entries</Typography>

        <Button
          variant="outlined"
          fullWidth
          onClick={handleNewEntry}
          sx={{ mb: 2 }}
        >
          ➕ New Lore Entry
        </Button>

        <InputBase
          placeholder="Search..."
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            border: '1px solid #ccc',
            borderRadius: 1,
            px: 1,
            mb: 2
          }}
        />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {allTags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              color={filterTag === tag ? 'primary' : 'default'}
            />
          ))}
        </Box>

        <Stack spacing={1} sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filteredLoreKeys.map(key => (
            <Button
              key={key}
              variant={key === selectedKey ? 'contained' : 'outlined'}
              onClick={() => handleLoreSelect(key)}
              fullWidth
            >
              {key}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Main Editor */}
      <Stack spacing={2} sx={{ flexGrow: 1 }}>
        <TextField
          label="Title"
          fullWidth
          value={lore.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />

        <TextField
          label="Summary"
          fullWidth
          value={lore.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
        />

        <TextField
          label="Full Text"
          fullWidth
          multiline
          rows={10}
          value={lore.fullText}
          onChange={(e) => handleChange('fullText', e.target.value)}
          inputProps={{
            spellCheck: false,
            autoCorrect: 'off',
            autoCapitalize: 'off'
          }}
        />

        <Typography variant="h6" sx={{ mt: 2 }}>Tags</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          {lore.tags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => handleRemoveTag(tag)}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="New Tag"
            size="small"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <IconButton color="primary" onClick={handleAddTag}><Add /></IconButton>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              fullWidth
              onClick={saveLoreToFirebase}
              disabled={!lore.title.trim()}
            >
              Save Lore Entry
            </Button>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}
