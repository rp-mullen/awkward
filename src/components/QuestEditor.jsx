import { useState, useEffect } from 'react';
import {
  Paper, Typography, Stack, TextField, Grid, Button, FormControl, InputLabel,
  Select, MenuItem, IconButton, Autocomplete
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { db } from '../firebase';
import { ref, set, onValue, runTransaction } from 'firebase/database';
import { downloadJson } from '../utils/downloadJson';

const GOAL_TYPES = [
  'TalkTo',
  'CollectItem',
  'DefeatEnemy',
  'ReachLocation',
  'TriggerEvent'
];

export default function QuestEditor() {
  const [questList, setQuestList] = useState([]);
  const [selectedQuestKey, setSelectedQuestKey] = useState('');
  const [quest, setQuest] = useState({
    questId: '',
    name: '',
    description: '',
    steps: []
  });

  const [targetOptions, setTargetOptions] = useState([]);

  useEffect(() => {
    const questRef = ref(db, 'quests/');
    onValue(questRef, (snapshot) => {
      const data = snapshot.val() || {};
      setQuestList(Object.keys(data));
    });

    const fetchTargets = async () => {
      const getNames = (path, keyName) => 
        new Promise(resolve => {
          onValue(ref(db, path), (snap) => {
            const val = snap.val() || {};
            const names = path === 'objs' 
              ? Object.values(val).map(v => v.objectName).filter(Boolean)
              : Object.keys(val);
            resolve(names.map(n => `${keyName}: ${n}`));
          }, { onlyOnce: true });
        });

      const [objNames, itemNames, charNames] = await Promise.all([
        getNames('objs', 'Object'),
        getNames('items', 'Item'),
        getNames('characters', 'Character')
      ]);

      setTargetOptions([...objNames, ...itemNames, ...charNames].sort());
    };

    fetchTargets();
  }, []);

  const handleQuestSelect = (key) => {
    if (key === 'new') {
      setQuest({ questId: '', name: '', description: '', steps: [] });
      setSelectedQuestKey('');
    } else {
      const questRef = ref(db, `quests/${key}`);
      onValue(questRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setQuest(data);
          setSelectedQuestKey(key);
        }
      }, { onlyOnce: true });
    }
  };

  const handleChange = (field, value) => {
    setQuest(prev => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (index, field, value) => {
    const updatedSteps = [...quest.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setQuest(prev => ({ ...prev, steps: updatedSteps }));
  };

  const handleAddStep = () => {
    const nextStepId = (quest.steps.length > 0 ? Math.max(...quest.steps.map(s => s.stepId || 0)) : 0) + 1;
    setQuest(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          stepId: nextStepId,
          description: '',
          goalType: GOAL_TYPES[0],
          targetId: ''
        }
      ]
    }));
  };

  const handleRemoveStep = (index) => {
    const updatedSteps = quest.steps.filter((_, i) => i !== index);
    setQuest(prev => ({ ...prev, steps: updatedSteps }));
  };

  const handleDownload = () => {
    downloadJson(quest, `${quest.name || 'NewQuest'}.quest.json`);
  };

  const saveQuestToFirebase = async () => {
    if (!quest.name) {
      alert('Please enter a quest name before saving.');
      return;
    }

    const questKey = quest.name;
    const questRef = ref(db, `quests/${questKey}`);
    const counterRef = ref(db, 'counters/questId');

    const questToSave = { ...quest };

    try {
      if (!questToSave.questId) {
        const result = await runTransaction(counterRef, (current) => {
          const currentNumber = typeof current === 'number' && !isNaN(current) ? current : 0;
          return currentNumber + 1;
        });

        if (result.committed) {
          questToSave.questId = result.snapshot.val();
        } else {
          alert('Failed to generate quest ID.');
          return;
        }
      }

      await set(questRef, questToSave);
      setQuest(questToSave);
      alert(`Quest "${questToSave.name}" saved with ID ${questToSave.questId}.`);
    } catch (error) {
      console.error(error);
      alert('Failed to save quest.');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" gutterBottom>Quest Editor</Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Quest</InputLabel>
        <Select
          value={selectedQuestKey}
          label="Select Quest"
          onChange={(e) => handleQuestSelect(e.target.value)}
        >
          {questList.map((key) => (
            <MenuItem key={key} value={key}>{key}</MenuItem>
          ))}
          <MenuItem value="new">➕ Create New Quest</MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={3}>
        <TextField
          label="Quest Name"
          fullWidth
          value={quest.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />

        <TextField
          label="Quest ID"
          fullWidth
          value={quest.questId || 'Auto-assigned'}
          InputProps={{ readOnly: true, sx: { backgroundColor: '#f5f5f5', color: '#666' } }}
        />

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={quest.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />

        <Typography variant="h6" sx={{ mt: 3 }}>Steps</Typography>

        {quest.steps.map((step, index) => (
          <Grid container spacing={2} alignItems="center" key={index} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Step ID"
                fullWidth
                value={step.stepId}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={12} sm={9}>
              <TextField
                label="Description"
                fullWidth
                value={step.description}
                onChange={(e) => handleStepChange(index, 'description', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Goal Type</InputLabel>
                <Select
                  value={step.goalType}
                  label="Goal Type"
                  onChange={(e) => handleStepChange(index, 'goalType', e.target.value)}
                >
                  {GOAL_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                freeSolo
                options={targetOptions}
                value={step.targetId || ''}
                onChange={(_, newValue) => handleStepChange(index, 'targetId', newValue)}
                renderInput={(params) => <TextField {...params} label="Target" fullWidth />}
              />
            </Grid>

            <Grid item xs={12} sm="auto">
              <IconButton onClick={() => handleRemoveStep(index)}>
                <Delete />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Button variant="outlined" startIcon={<Add />} onClick={handleAddStep}>
          Add Step
        </Button>

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth onClick={handleDownload}>Download .quest JSON</Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" color="success" fullWidth onClick={saveQuestToFirebase}>Save to Database</Button>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}
