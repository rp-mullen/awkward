import { useState, useEffect } from 'react';
import {
  Paper, Typography, Stack, Select, MenuItem, FormControl, InputLabel,
  TextField, FormControlLabel, Checkbox, Button, Autocomplete
} from '@mui/material';
import Editor from 'react-simple-code-editor';
import { highlightDialogue } from '../utils/highlightDialogue';
import { downloadJson } from '../utils/downloadJson';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { dialogueTemplate } from '../dataModels/dialogueTemplate';

const generateNextEntryId = (dialogues) => {
  const existingIds = dialogues.map(e => e.entryId);
  let nextId = 0;
  while (existingIds.includes(nextId)) {
    nextId++;
  }
  return nextId;
};

const handleEditorKeyDown = (e, value, setValue) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const tabChar = '\t';
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue = value.substring(0, start) + tabChar + value.substring(end);
    setValue(newValue);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + tabChar.length;
    }, 0);
  }
};

export default function DialogueLibraryEditor() {
  const [dialogueLibrary, setDialogueLibrary] = useState({ ...dialogueTemplate, characterId: '', dialogues: [] });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [questList, setQuestList] = useState([]);
  const [questStepMap, setQuestStepMap] = useState({});
  const [targetName, setTargetName] = useState('');
  const [availableTargets, setAvailableTargets] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const charRef = ref(db, 'characters/');
      const objRef = ref(db, 'objs/');
      const questRef = ref(db, 'quests/');

      const charPromise = new Promise(resolve => {
        onValue(charRef, snap => {
          const val = snap.val();
          resolve(val ? Object.keys(val) : []);
        }, { onlyOnce: true });
      });

      const objPromise = new Promise(resolve => {
        onValue(objRef, snap => {
          const val = snap.val();
          const names = val ? Object.values(val).map(obj => obj?.objectName || '').filter(Boolean) : [];
          resolve(names);
        }, { onlyOnce: true });
      });

      const questPromise = new Promise(resolve => {
        onValue(questRef, snap => {
          const val = snap.val() || {};
          const names = Object.keys(val);
          const stepMap = {};
          names.forEach(qName => {
            const steps = val[qName]?.steps || [];
            stepMap[qName] = steps.map(s => s.stepId);
          });
          resolve({ names, stepMap });
        }, { onlyOnce: true });
      });

      const [charNames, objNames, questData] = await Promise.all([charPromise, objPromise, questPromise]);
      setAvailableTargets([...charNames, ...objNames]);
      setQuestList(questData.names);
      setQuestStepMap(questData.stepMap);
    };

    fetchData();
  }, []);

  const handleTargetSelect = (event, value) => {
    if (!value) return;

    setTargetName(value);

    const dialogueRef = ref(db, `dialogue/${value}`);
    onValue(dialogueRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data.dialogues) && data.dialogues.length > 0) {
        setDialogueLibrary(data);
        setSelectedIndex(0);
      } else {
        const blankLibrary = { ...dialogueTemplate, characterId: value, dialogues: [] };
        setDialogueLibrary(blankLibrary);
        setSelectedIndex(-1);
      }
    }, { onlyOnce: true });
  };

  const handleDialogueChange = (field, value) => {
    const updatedDialogues = [...dialogueLibrary.dialogues];
    if (selectedIndex >= 0) {
      updatedDialogues[selectedIndex] = { ...updatedDialogues[selectedIndex], [field]: value };
      setDialogueLibrary(prev => ({ ...prev, dialogues: updatedDialogues }));
    }
  };

  const handleConditionChange = (field, value) => {
    const updatedDialogues = [...dialogueLibrary.dialogues];
    if (selectedIndex >= 0) {
      updatedDialogues[selectedIndex].condition = {
        ...updatedDialogues[selectedIndex].condition,
        [field]: value
      };
      setDialogueLibrary(prev => ({ ...prev, dialogues: updatedDialogues }));
    }
  };

  const handleSelectChange = (e) => {
    const value = e.target.value;
    if (value === 'add-new') {
      const existingNames = dialogueLibrary.dialogues.map(d => d.displayName);
      let baseName = 'New Entry';
      let uniqueName = baseName;
  
      let counter = 2;
      while (existingNames.includes(uniqueName)) {
        uniqueName = `${baseName} ${counter}`;
        counter++;
      }
  
      const newEntry = {
        entryId: generateNextEntryId(dialogueLibrary.dialogues),
        displayName: uniqueName,
        conversationText: '',
        isDefault: false,
        condition: {
          requiredQuestId: '',
          requiredStepId: '',
          requiredStepStatus: ''
        }
      };
  
      const updatedDialogues = [...dialogueLibrary.dialogues, newEntry];
      setDialogueLibrary(prev => ({ ...prev, dialogues: updatedDialogues }));
      setSelectedIndex(updatedDialogues.length - 1);
    } else {
      setSelectedIndex(value);
    }
  };
  

  const handleDownload = () => {
    if (!targetName) return;
    downloadJson(dialogueLibrary, `${targetName}.dlg.json`);
  };

  const handleSave = () => {
    if (!targetName) {
      alert('Please select a Character or Object name.');
      return;
    }
    const saveRef = ref(db, `dialogue/${targetName}`);
    set(saveRef, dialogueLibrary)
      .then(() => alert(`Dialogue saved under dialogue/${targetName}`))
      .catch(err => {
        console.error(err);
        alert('Failed to save dialogue.');
      });
  };

  const currentEntry = selectedIndex >= 0 ? dialogueLibrary.dialogues[selectedIndex] : null;

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" gutterBottom>Dialogue Library Editor</Typography>

      <Autocomplete
        fullWidth
        freeSolo
        options={availableTargets}
        value={targetName}
        onChange={(e, newValue) => handleTargetSelect(e, newValue)}
        renderInput={(params) => <TextField {...params} label="Character or Object" />}
        sx={{ mb: 3 }}
      />

      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel>Select Dialogue Entry</InputLabel>
          <Select
            value={selectedIndex >= 0 ? selectedIndex : ''}
            label="Select Dialogue Entry"
            onChange={handleSelectChange}
          >
            {dialogueLibrary.dialogues.map((entry, index) => (
              <MenuItem key={index} value={index}>
                {`${entry.displayName || 'Untitled'}: ${entry.entryId}`}
              </MenuItem>
            ))}
            <MenuItem value="add-new">➕ Add New Entry</MenuItem>
          </Select>
        </FormControl>

        {currentEntry && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <TextField
              label="Entry Name"
              fullWidth
              value={currentEntry.displayName}
              onChange={(e) => handleDialogueChange('displayName', e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" sx={{ fontStyle: 'italic', mb: 2 }}>
              Entry ID: {currentEntry.entryId}
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>Conversation Text:</Typography>

            <Editor
              value={currentEntry.conversationText}
              onValueChange={(code) => handleDialogueChange('conversationText', code)}
              highlight={highlightDialogue}
              padding={10}
              onKeyDown={(e) =>
                handleEditorKeyDown(e, currentEntry.conversationText, (newText) => handleDialogueChange('conversationText', newText))
              }
              style={{
                fontFamily: 'monospace',
                fontSize: 14,
                minHeight: '120px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#fdfdfd'
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={currentEntry.isDefault}
                  onChange={(e) => handleDialogueChange('isDefault', e.target.checked)}
                />
              }
              label="Is Default"
              sx={{ mt: 2 }}
            />

            <Typography variant="subtitle2" sx={{ mt: 3 }}>Condition:</Typography>

            <Autocomplete
              freeSolo
              fullWidth
              options={questList}
              value={currentEntry.condition.requiredQuestId || ''}
              onChange={(_, newValue) => handleConditionChange('requiredQuestId', newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Required Quest ID" fullWidth />
              )}
              sx={{ mt: 1 }}
            />

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Required Step ID</InputLabel>
              <Select
                value={currentEntry.condition.requiredStepId || ''}
                label="Required Step ID"
                onChange={(e) => handleConditionChange('requiredStepId', e.target.value)}
              >
                {(questStepMap[currentEntry.condition.requiredQuestId] || []).map((stepId) => (
                  <MenuItem key={stepId} value={stepId}>{stepId}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Required Step Status"
              fullWidth
              value={currentEntry.condition.requiredStepStatus}
              onChange={(e) => handleConditionChange('requiredStepStatus', e.target.value)}
              sx={{ mt: 2 }}
            />
          </Paper>
        )}

        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleDownload} fullWidth>
            Download .dlg JSON
          </Button>
          <Button variant="contained" color="success" onClick={handleSave} fullWidth>
            Save to Database
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
