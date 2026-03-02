import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Autocomplete,
  Divider,
  Paper,
  Stack,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableContainer,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  AccountTree as AccountTreeIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { createBulkRelationships } from '../../services/graph';
import { translateBulkRelationships, validateRelationship } from '../../services/relationshipTranslator';
import { relationshipCategories, getRelationshipDisplayName, allRelationshipLabels } from '../RelationshipWizard/relationshipIcons';

const CSV_HEADERS = ['base_person_name', 'relationship_label', 'target_person_name'];
const MAX_CSV_ROWS = 500;
const TEMPLATE_FILENAME = 'bulk-relationships-template.csv';

/** Parse a single CSV line handling quoted fields (e.g. "Name, Jr.",value) */
function parseCSVLine(line) {
  const result = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let field = '';
      i += 1;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i += 1;
            break;
          }
        } else {
          field += line[i];
          i += 1;
        }
      }
      result.push(field.trim());
    } else {
      let field = '';
      while (i < line.length && line[i] !== ',') {
        field += line[i];
        i += 1;
      }
      result.push(field.trim());
      if (i < line.length) i += 1;
    }
  }
  return result;
}

/** Parse CSV text into rows of { base_person_name, relationship_label, target_person_name } */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  const headerNormalized = CSV_HEADERS.map((h) => h.toLowerCase());
  for (let i = 0; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length < 3) continue;
    const isHeader = headerNormalized.includes(String(cells[0]).toLowerCase()) &&
      headerNormalized.includes(String(cells[1]).toLowerCase()) &&
      headerNormalized.includes(String(cells[2]).toLowerCase());
    if (isHeader && rows.length === 0) continue;
    rows.push({
      base_person_name: (cells[0] || '').trim(),
      relationship_label: (cells[1] || '').trim().toLowerCase(),
      target_person_name: (cells[2] || '').trim(),
    });
  }
  return rows;
}

/**
 * BulkRelationshipInput Component
 * Allows creating multiple family relationships at once using user-friendly labels
 */
const BulkRelationshipInput = ({
  open,
  onClose,
  familyId,
  persons,
  topology,
  viewerPersonId,
  currentUserPersonId,
  onSuccess,
}) => {
  const [basePersonId, setBasePersonId] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [tabMode, setTabMode] = useState('manual');
  const [csvRows, setCsvRows] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');

  // Initialize base person when dialog opens; reset CSV state
  useEffect(() => {
    if (open) {
      const defaultPersonId = currentUserPersonId || viewerPersonId || (persons.length > 0 ? persons[0].id : null);
      setBasePersonId(defaultPersonId);
      setRelationships([]);
      setError(null);
      setSuccess(false);
      setValidationErrors({});
      setCsvRows([]);
      setCsvFileName('');
    }
  }, [open, currentUserPersonId, viewerPersonId, persons]);

  // Name → person id map (normalized full name, first match; case-insensitive)
  const nameToIdMap = useMemo(() => {
    const map = new Map();
    persons.forEach((p) => {
      const full = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      if (!full) return;
      const key = full.toLowerCase();
      if (!map.has(key)) map.set(key, p.id);
    });
    return map;
  }, [persons]);

  // Get all available relationship labels
  const allLabels = useMemo(() => {
    const labels = [];
    Object.values(relationshipCategories).forEach(category => {
      labels.push(...category.labels);
    });
    return labels;
  }, []);

  const getPersonName = (person) => {
    if (!person) return 'Unknown';
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || `Person ${person.id}`;
  };

  const handleAddRelationship = () => {
    setRelationships([...relationships, { label: '', targetId: null, id: Date.now() }]);
  };

  const handleRemoveRelationship = (id) => {
    setRelationships(relationships.filter(rel => rel.id !== id));
    // Remove validation error for this relationship
    const newErrors = { ...validationErrors };
    delete newErrors[id];
    setValidationErrors(newErrors);
  };

  const handleRelationshipChange = (id, field, value) => {
    setRelationships(relationships.map(rel => 
      rel.id === id ? { ...rel, [field]: value } : rel
    ));
    
    // Clear validation error when user changes the field
    if (validationErrors[id]) {
      const newErrors = { ...validationErrors };
      delete newErrors[id];
      setValidationErrors(newErrors);
    }
  };

  // Validate all relationships
  const validateAll = () => {
    if (!basePersonId) {
      setError('Please select a base person');
      return false;
    }

    if (relationships.length === 0) {
      setError('Please add at least one relationship');
      return false;
    }

    const errors = {};
    let hasErrors = false;

    relationships.forEach(rel => {
      if (!rel.label) {
        errors[rel.id] = 'Please select a relationship type';
        hasErrors = true;
      } else if (!rel.targetId) {
        errors[rel.id] = 'Please select a person';
        hasErrors = true;
      } else if (rel.targetId === basePersonId) {
        errors[rel.id] = 'Cannot create relationship to yourself';
        hasErrors = true;
      } else if (topology) {
        // Use existing validation
        const validation = validateRelationship(basePersonId, rel.targetId, rel.label, topology);
        if (!validation.valid) {
          errors[rel.id] = validation.errors.join('. ');
          hasErrors = true;
        }
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  // Get preview of relationships to be created
  const getPreview = () => {
    if (!basePersonId || !topology || relationships.length === 0) {
      return { edges: [], missingPersons: [], warnings: [] };
    }

    const validRelationships = relationships.filter(rel => 
      rel.label && rel.targetId && rel.targetId !== basePersonId && !validationErrors[rel.id]
    );

    if (validRelationships.length === 0) {
      return { edges: [], missingPersons: [], warnings: [] };
    }

    const requests = validRelationships.map(rel => ({
      viewerId: basePersonId,
      targetId: rel.targetId,
      label: rel.label,
    }));

    return translateBulkRelationships(requests, topology);
  };

  const downloadTemplate = () => {
    const exampleRows = [
      [CSV_HEADERS[0], CSV_HEADERS[1], CSV_HEADERS[2]],
      ['John Doe', 'father', 'Mary Doe'],
      ['Mary Doe', 'mother', 'John Doe'],
    ];
    const escape = (v) => (v.includes(',') || v.includes('"') ? `"${String(v).replace(/"/g, '""')}"` : v);
    const csv = exampleRows.map((row) => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = TEMPLATE_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolveName = (name) => {
    if (!name) return null;
    return nameToIdMap.get(name.toLowerCase()) ?? null;
  };

  const validateCsvRows = (rows) => {
    return rows.map((row, idx) => {
      const rowIndex = idx + 1;
      const base = row.base_person_name;
      const label = row.relationship_label;
      const target = row.target_person_name;
      const viewerId = resolveName(base);
      const targetId = resolveName(target);
      let error = null;
      if (!viewerId) error = base ? `Person not found: ${base}` : 'Base person name is empty';
      else if (!targetId) error = target ? `Person not found: ${target}` : 'Target person name is empty';
      else if (!allRelationshipLabels.includes(label)) error = `Invalid label: ${label}`;
      else if (viewerId === targetId) error = 'Same person on both sides';
      else if (topology) {
        const validation = validateRelationship(viewerId, targetId, label, topology);
        if (!validation.valid) error = validation.errors?.join('. ') || 'Invalid relationship';
      }
      return {
        rowIndex,
        base_person_name: base,
        relationship_label: label,
        target_person_name: target,
        viewerId: error ? null : viewerId,
        targetId: error ? null : targetId,
        error,
      };
    });
  };

  const handleCsvFileSelect = (event) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file.');
      return;
    }
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result ?? '';
        const rows = parseCSV(text);
        if (rows.length > MAX_CSV_ROWS) {
          setError(`Too many rows. Maximum is ${MAX_CSV_ROWS}.`);
          setCsvRows([]);
          return;
        }
        if (rows.length === 0) {
          setError('No data rows found in the CSV.');
          setCsvRows([]);
          return;
        }
        setCsvRows(validateCsvRows(rows));
      } catch (err) {
        setError('Failed to parse CSV. Check the file format.');
        setCsvRows([]);
      }
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  };

  const csvValidRows = useMemo(
    () => csvRows.filter((r) => !r.error && r.viewerId && r.targetId),
    [csvRows]
  );

  const handleCsvRowRelationshipChange = (rowIndexOneBased, newLabel) => {
    const rawRows = csvRows.map((r) => ({
      base_person_name: r.base_person_name,
      relationship_label: r.relationship_label,
      target_person_name: r.target_person_name,
    }));
    const idx = rowIndexOneBased - 1;
    if (idx >= 0 && idx < rawRows.length) {
      rawRows[idx].relationship_label = newLabel;
      setCsvRows(validateCsvRows(rawRows));
    }
  };

  const handleCsvSubmit = async () => {
    if (csvValidRows.length === 0) return;
    setError(null);
    setCreating(true);
    try {
      const relationshipsToSend = csvValidRows.map((r) => ({
        viewerId: r.viewerId,
        targetId: r.targetId,
        label: r.relationship_label,
      }));
      const result = await createBulkRelationships({ familyId, relationships: relationshipsToSend });
      setSuccess(true);
      if (result.failed_count > 0) {
        setError(`${result.created_count} created, ${result.failed_count} failed. ${(result.failed || []).map((f) => f.error).join('; ')}`);
      }
      setTimeout(() => {
        setError(null);
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.error ||
        (err.response?.data?.failed?.length
          ? `${err.response.data.failed.length} relationship(s) failed. ${err.response.data.failed.map((f) => f.error).join('; ')}`
          : null) ||
        'Failed to create relationships. Please try again.';
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleCreate = async () => {
    setError(null);

    if (!validateAll()) {
      return;
    }

    const validRelationships = relationships.filter(rel => 
      rel.label && rel.targetId && rel.targetId !== basePersonId && !validationErrors[rel.id]
    );

    if (validRelationships.length === 0) {
      setError('No valid relationships to create');
      return;
    }

    setCreating(true);

    try {
      const requests = validRelationships.map(rel => ({
        viewerId: basePersonId,
        targetId: rel.targetId,
        label: rel.label,
      }));

      const result = await createBulkRelationships({
        familyId,
        relationships: requests,
      });

      setSuccess(true);

      // Show success message briefly, then close
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error creating bulk relationships:', err);
      const errorMessage = err.response?.data?.error || 
        (err.response?.data?.failed && err.response.data.failed.length > 0
          ? `${err.response.data.failed.length} relationship(s) failed. ${err.response.data.failed.map(f => f.error).join('; ')}`
          : null) ||
        'Failed to create relationships. Please try again.';
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const preview = getPreview();
  const basePerson = persons.find(p => p.id === basePersonId);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '500px',
          bgcolor: 'background.paper',
          backdropFilter: 'none',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 6,
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(10, 12, 16, 0.6)',
          backdropFilter: 'blur(2px)',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountTreeIcon color="primary" />
          <Typography variant="h6">Bulk Add Relationships</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            Relationships created successfully! The family topology has been updated.
          </Alert>
        ) : (
          <>
            <Tabs value={tabMode} onChange={(_, v) => setTabMode(v)} sx={{ mb: 2 }}>
              <Tab label="Manual" value="manual" />
              <Tab label="CSV upload" value="csv" />
            </Tabs>

            {tabMode === 'csv' ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Download a template, fill it with base person name, relationship label, and target person name (use exact names as in the family). Then upload the CSV.
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }} variant="outlined">
                  <Typography variant="caption" component="span">
                    <strong>How relationships are read:</strong> The label is from the <strong>base person&apos;s perspective</strong>. E.g. &quot;John Doe, father, Mary Doe&quot; means Mary Doe is John Doe&apos;s father (Mary is the parent, John is the child). To say John is Mary&apos;s father, use: Mary Doe, father, John Doe. You can fix the relationship type below using the dropdown.
                  </Typography>
                </Alert>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Button startIcon={<DownloadIcon />} onClick={downloadTemplate} variant="outlined" size="small">
                    Download template
                  </Button>
                  <Button component="label" startIcon={<UploadFileIcon />} variant="outlined" size="small">
                    {csvFileName || 'Select CSV file'}
                    <input type="file" accept=".csv" hidden onChange={handleCsvFileSelect} />
                  </Button>
                </Stack>
                {csvRows.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {csvValidRows.length} valid, {csvRows.filter((r) => r.error).length} error(s)
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, mb: 2 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Row</TableCell>
                            <TableCell>Base person</TableCell>
                            <TableCell>Relationship</TableCell>
                            <TableCell>Target person</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {csvRows.map((r) => (
                            <TableRow key={r.rowIndex}>
                              <TableCell>{r.rowIndex}</TableCell>
                              <TableCell>{r.base_person_name}</TableCell>
                              <TableCell>
                                <FormControl size="small" fullWidth variant="outlined" sx={{ minWidth: 140 }}>
                                  <Select
                                    value={allRelationshipLabels.includes(r.relationship_label) ? r.relationship_label : ''}
                                    onChange={(e) => handleCsvRowRelationshipChange(r.rowIndex, e.target.value)}
                                    displayEmpty
                                    disabled={creating}
                                  >
                                    <MenuItem value="" disabled>
                                      {r.relationship_label || 'Select…'}
                                    </MenuItem>
                                    {allRelationshipLabels.map((label) => (
                                      <MenuItem key={label} value={label}>
                                        {getRelationshipDisplayName(label)}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell>{r.target_person_name}</TableCell>
                              <TableCell>
                                {r.error ? (
                                  <Typography variant="caption" color="error">{r.error}</Typography>
                                ) : (
                                  <Chip label="OK" size="small" color="success" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Add multiple family relationships at once. Select a base person and add their relationships to other family members.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {/* Base Person Selection */}
                <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Base Person *</InputLabel>
              <Select
                value={basePersonId || ''}
                onChange={(e) => setBasePersonId(e.target.value)}
                label="Base Person *"
                disabled={creating}
              >
                {persons.map(person => (
                  <MenuItem key={person.id} value={person.id}>
                    {getPersonName(person)}
                    {person.id === currentUserPersonId && (
                      <Chip label="You" size="small" sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            {/* Relationship Rows */}
            <Box sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Relationships ({relationships.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={handleAddRelationship}
                  disabled={creating || !basePersonId}
                >
                  Add Relationship
                </Button>
              </Box>

              {relationships.length === 0 ? (
                <Alert severity="info">
                  Click "Add Relationship" to start adding relationships.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {relationships.map((rel) => {
                    const error = validationErrors[rel.id];
                    const targetPerson = persons.find(p => p.id === rel.targetId);
                    
                    return (
                      <Paper key={rel.id} variant="outlined" sx={{ p: 2, bgcolor: error ? 'error.light' : 'background.paper' }}>
                        <Box display="flex" gap={2} alignItems="flex-start">
                          <FormControl sx={{ minWidth: 200, flex: 1 }}>
                            <InputLabel>Relationship Type</InputLabel>
                            <Select
                              value={rel.label || ''}
                              onChange={(e) => handleRelationshipChange(rel.id, 'label', e.target.value)}
                              label="Relationship Type"
                              disabled={creating}
                              error={!!error}
                            >
                              {allLabels.map(label => (
                                <MenuItem key={label} value={label}>
                                  {getRelationshipDisplayName(label)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Autocomplete
                            sx={{ minWidth: 200, flex: 1 }}
                            options={persons.filter(p => p.id !== basePersonId)}
                            getOptionLabel={(option) => getPersonName(option)}
                            value={targetPerson || null}
                            onChange={(event, newValue) => {
                              handleRelationshipChange(rel.id, 'targetId', newValue?.id || null);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Person"
                                error={!!error}
                                disabled={creating}
                              />
                            )}
                          />

                          <IconButton
                            onClick={() => handleRemoveRelationship(rel.id)}
                            disabled={creating}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>

                        {error && (
                          <Alert severity="error" sx={{ mt: 1 }} icon={<ErrorIcon />}>
                            {error}
                          </Alert>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>

            {/* Preview Section */}
            {basePersonId && relationships.length > 0 && preview.edges.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview: Relationships to be created ({preview.edges.length})
                  </Typography>
                  <List dense>
                    {preview.edges.map((edge, index) => {
                      const fromPerson = persons.find(p => p.id === edge.from);
                      const toPerson = persons.find(p => p.id === edge.to);
                      return (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2">
                                  {fromPerson ? getPersonName(fromPerson) : `Person ${edge.from}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">→</Typography>
                                <Typography variant="body2">
                                  {toPerson ? getPersonName(toPerson) : `Person ${edge.to}`}
                                </Typography>
                                <Chip
                                  label={edge.type.replace('_', ' ')}
                                  size="small"
                                  color={edge.type === 'PARENT_OF' ? 'primary' : 'secondary'}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </>
            )}

            {/* Missing Persons Warnings */}
            {preview.missingPersons.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningIcon />}>
                <Typography variant="subtitle2" gutterBottom>
                  Missing Intermediate Persons:
                </Typography>
                <List dense>
                  {preview.missingPersons.map((mp, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={mp.message}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Warnings:
                </Typography>
                <List dense>
                  {preview.warnings.map((w, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={w.message}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={creating || success}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && tabMode === 'csv' && (
          <Button
            onClick={handleCsvSubmit}
            variant="contained"
            disabled={creating || csvValidRows.length === 0}
            startIcon={creating ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {creating ? 'Creating...' : `Create ${csvValidRows.length} Relationship(s)`}
          </Button>
        )}
        {!success && tabMode === 'manual' && (
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !basePersonId || relationships.length === 0}
            startIcon={creating ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {creating ? 'Creating...' : `Create ${relationships.filter(r => r.label && r.targetId).length} Relationship(s)`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkRelationshipInput;
