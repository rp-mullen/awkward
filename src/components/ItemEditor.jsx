import { useState, useEffect } from 'react';
import {
  Paper, Typography, Stack, TextField, Grid, Button,
  FormControl, InputLabel, Select, MenuItem, Box, IconButton
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { ref, onValue, set, remove, runTransaction } from 'firebase/database';
import { itemTemplate } from '../dataModels/itemTemplate';

export default function ItemEditor() {
  const [itemList, setItemList] = useState([]);
  const [selectedItemKey, setSelectedItemKey] = useState('');
  const [item, setItem] = useState({ ...itemTemplate });
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    const itemsRef = ref(db, 'items/');
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setItemList(Object.keys(data));
    });
  }, []);

  const handleItemSelect = (key) => {
    const itemRef = ref(db, `items/${key}`);
    onValue(itemRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setItem({ ...itemTemplate, ...data });
        setSelectedItemKey(key);
      }
    }, { onlyOnce: true });
  };

  const handleChange = (field, value) => {
    setItem(prev => ({ ...prev, [field]: value }));
  };

  const saveItemToFirebase = async () => {
    const keyName = item.itemName?.trim();

    if (!keyName) {
      alert('Please enter a valid Item Name before saving.');
      return;
    }

    const isNumericKey = /^\d+$/.test(selectedItemKey);
    const newKey = keyName;

    let itemToSave = { ...item };

    if (!itemToSave.itemID) {
      const counterRef = ref(db, 'counters/itemId');
      try {
        const result = await runTransaction(counterRef, (current) => (current || 0) + 1);
        if (result.committed) {
          itemToSave.itemID = result.snapshot.val();
        } else {
          alert('Failed to generate unique item ID.');
          return;
        }
      } catch (err) {
        console.error(err);
        alert('Error generating item ID.');
        return;
      }
    }

    itemToSave.displayName = itemToSave.displayName || `${itemToSave.itemName} (Item)`;

    if (isNumericKey && selectedItemKey !== newKey) {
      const oldRef = ref(db, `items/${selectedItemKey}`);
      await remove(oldRef);
    }

    const itemRef = ref(db, `items/${newKey}`);
    set(itemRef, itemToSave)
      .then(() => {
        setItem(itemToSave);
        setSelectedItemKey(newKey);
        alert(`Item "${itemToSave.itemName}" saved successfully.`);
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to save item.');
      });
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4, width: '100%' }}>
      <Typography variant="h5" gutterBottom>Item Editor</Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Item</InputLabel>
        <Select
          value={selectedItemKey}
          label="Select Item"
          onChange={(e) => handleItemSelect(e.target.value)}
        >
          {itemList.map((key) => (
            <MenuItem key={key} value={key}>{key}</MenuItem>
          ))}
          <MenuItem value="new" onClick={() => {
            setItem({ ...itemTemplate });
            setSelectedItemKey('');
          }}>
            Create New Item
          </MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={3}>
        <TextField label="Item Name (Key)" fullWidth value={item.itemName} onChange={(e) => handleChange('itemName', e.target.value)} />
        <TextField label="Display Name" fullWidth value={item.displayName} onChange={(e) => handleChange('displayName', e.target.value)} />
        <TextField label="Description" fullWidth value={item.description} onChange={(e) => handleChange('description', e.target.value)} multiline rows={3} inputProps={{ spellCheck: false }} />
        <TextField label="Short Description" fullWidth value={item.itemDescription} onChange={(e) => handleChange('itemDescription', e.target.value)} multiline rows={2} inputProps={{ spellCheck: false }} />
        <TextField label="Item Type (Number)" type="number" fullWidth value={item.itemType} onChange={(e) => handleChange('itemType', parseInt(e.target.value) || 0)} />
        <TextField label="Gold Value" type="number" fullWidth value={item.goldValue} onChange={(e) => handleChange('goldValue', parseInt(e.target.value) || 0)} />

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <Button variant="contained" fullWidth onClick={saveItemToFirebase}>Save Item</Button>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}
