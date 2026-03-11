import { useEffect, useState, useRef } from 'react';
import {
  getAttendance,
  getEmployees,
  markAttendance,
  updateAttendance,
  deleteAttendance,
} from '../api';
import { useToast } from '../components/Toast';
import Modal, { ConfirmModal } from '../components/Modal';

function getApiError(err) {
  const detail = err.response?.data?.detail;
  if (!detail) return 'Something went wrong';
  if (Array.isArray(detail))
    return detail.map((d) => d.msg ?? String(d)).join(', ');
  return String(detail);
}

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Half Day'];

const badgeClass = {
  Present: 'badge-present',
  Absent: 'badge-absent',
  Late: 'badge-late',
  'Half Day': 'badge-half',
};

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function Attendance() {
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterEmp, setFilterEmp] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Mark modal
  const [showMark, setShowMark] = useState(false);
  const [markForm, setMarkForm] = useState({
    employee_id: '',
    date: today(),
    status: 'Present',
  });
  const [marking, setMarking] = useState(false);

  // Edit modal
  const [editRecord, setEditRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Refs so fetchRecords() always reads the latest filter values
  // without needing to be recreated (same pattern as Employees.jsx)
  const filterEmpRef = useRef(filterEmp);
  const filterFromRef = useRef(filterFrom);
  const filterToRef = useRef(filterTo);
  const filterStatusRef = useRef(filterStatus);
  filterEmpRef.current = filterEmp;
  filterFromRef.current = filterFrom;
  filterToRef.current = filterTo;
  filterStatusRef.current = filterStatus;

  const fetchRecords = () => {
    const params = {};
    if (filterEmpRef.current) params.employee_id = filterEmpRef.current;
    if (filterFromRef.current) params.from_date = filterFromRef.current;
    if (filterToRef.current) params.to_date = filterToRef.current;
    if (filterStatusRef.current) params.status = filterStatusRef.current;
    return getAttendance(params).then((r) => setRecords(r.data));
  };

  const fetchAllEmployees = () =>
    getEmployees().then((r) => setEmployees(r.data));

  // Initial load only
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRecords(), fetchAllEmployees()])
      .catch(() => toast('Failed to load attendance', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when filters change (debounced 300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords().catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [filterEmp, filterFrom, filterTo, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleMark() {
    if (!markForm.employee_id || !markForm.date || !markForm.status) {
      toast('Please fill all fields', 'error');
      return;
    }
    setMarking(true);
    try {
      await markAttendance(markForm);
      toast('Attendance marked successfully');
      setShowMark(false);
      setMarkForm({ employee_id: '', date: today(), status: 'Present' });
      await fetchRecords();
    } catch (err) {
      toast(getApiError(err) || 'Failed to mark attendance', 'error');
    } finally {
      setMarking(false);
    }
  }

  async function handleUpdate() {
    setUpdating(true);
    try {
      await updateAttendance(editRecord.id, { status: editStatus });
      toast('Attendance updated');
      setEditRecord(null);
      await fetchRecords();
    } catch (err) {
      toast(getApiError(err) || 'Update failed', 'error');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAttendance(confirmDelete.id);
      toast('Record deleted');
      setConfirmDelete(null);
      await fetchRecords();
    } catch {
      toast('Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  }

  // Summary counts
  const counts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Summary Bar */}
      {records.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          {STATUS_OPTIONS.map((s) =>
            counts[s] ? (
              <div
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 14px',
                }}
              >
                <span className={`badge ${badgeClass[s]}`}>{s}</span>
                <span style={{ fontWeight: 700 }}>{counts[s]}</span>
              </div>
            ) : null,
          )}
        </div>
      )}

      {/* Filters */}
      <div className='filters'>
        <select
          value={filterEmp}
          onChange={(e) => setFilterEmp(e.target.value)}
          style={{ flex: 1, maxWidth: 220 }}
        >
          <option value=''>All Employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <input
          type='date'
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          max={today()}
          style={{ flex: 1, maxWidth: 160 }}
        />
        <input
          type='date'
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          max={today()}
          style={{ flex: 1, maxWidth: 160 }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ flex: 1, maxWidth: 160 }}
        >
          <option value=''>All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {(filterEmp || filterFrom || filterTo || filterStatus) && (
          <button
            className='btn btn-ghost btn-sm'
            onClick={() => {
              setFilterEmp('');
              setFilterFrom('');
              setFilterTo('');
              setFilterStatus('');
            }}
          >
            Clear
          </button>
        )}
        <button
          className='btn btn-primary'
          onClick={() => setShowMark(true)}
          style={{ marginLeft: 'auto' }}
        >
          <svg
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
            />
          </svg>
          Mark Attendance
        </button>
      </div>

      {/* Table */}
      <div className='card'>
        {loading ? (
          <div className='spinner' />
        ) : records.length === 0 ? (
          <div className='empty-state'>
            <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
              />
            </svg>
            <p>No attendance records found.</p>
          </div>
        ) : (
          <div className='table-wrap'>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Marked At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {r.employee_name || '—'}
                      </div>
                      <div className='td-muted'>{r.employee_code}</div>
                    </td>
                    <td>
                      {new Date(r.date + 'T00:00:00').toLocaleDateString(
                        'en-IN',
                        { day: 'numeric', month: 'short', year: 'numeric' },
                      )}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className='td-muted'>
                      {new Date(r.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <div className='actions'>
                        <button
                          className='btn btn-ghost btn-sm'
                          onClick={() => {
                            setEditRecord(r);
                            setEditStatus(r.status);
                          }}
                        >
                          <svg
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={2}
                            style={{ width: 14, height: 14 }}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z'
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          className='btn btn-ghost btn-sm'
                          style={{ color: 'var(--red)' }}
                          onClick={() => setConfirmDelete(r)}
                        >
                          <svg
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={2}
                            style={{ width: 14, height: 14 }}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2m10 0H5'
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Modal */}
      {showMark && (
        <Modal
          title='Mark Attendance'
          onClose={() => setShowMark(false)}
          footer={
            <>
              <button
                className='btn btn-ghost'
                onClick={() => setShowMark(false)}
              >
                Cancel
              </button>
              <button
                className='btn btn-primary'
                onClick={handleMark}
                disabled={marking}
              >
                {marking ? 'Marking…' : 'Mark Attendance'}
              </button>
            </>
          }
        >
          <div className='form-group'>
            <label>Employee *</label>
            <select
              value={markForm.employee_id}
              onChange={(e) =>
                setMarkForm((f) => ({ ...f, employee_id: e.target.value }))
              }
            >
              <option value=''>Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employee_id})
                </option>
              ))}
            </select>
          </div>
          <div className='form-row'>
            <div className='form-group'>
              <label>Date *</label>
              <input
                type='date'
                value={markForm.date}
                max={today()}
                onChange={(e) =>
                  setMarkForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className='form-group'>
              <label>Status *</label>
              <select
                value={markForm.status}
                onChange={(e) =>
                  setMarkForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editRecord && (
        <Modal
          title='Update Attendance'
          onClose={() => setEditRecord(null)}
          footer={
            <>
              <button
                className='btn btn-ghost'
                onClick={() => setEditRecord(null)}
              >
                Cancel
              </button>
              <button
                className='btn btn-primary'
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? 'Updating…' : 'Update'}
              </button>
            </>
          }
        >
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Updating attendance for <strong>{editRecord.employee_name}</strong>{' '}
            on{' '}
            {new Date(editRecord.date + 'T00:00:00').toLocaleDateString(
              'en-IN',
              { day: 'numeric', month: 'long', year: 'numeric' },
            )}
          </p>
          <div className='form-group'>
            <label>New Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <ConfirmModal
          message={`Delete attendance record for ${confirmDelete.employee_name} on ${new Date(confirmDelete.date + 'T00:00:00').toLocaleDateString('en-IN')}?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
