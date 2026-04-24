
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import {
  ScannedFile,
  RiskType,
  FileCategory,
  MockEmail,
} from '../types';
import { analyzeImage, analyzeFileName } from '../services/geminiService';
import { fetchMockEmails, deleteMockAttachment } from '../services/mockGmailService';
import { ShieldCheckIcon, WarningIcon, DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon, UploadIcon } from './Icons';

// --- Helper Functions ---
const getFileCategory = (file: File): FileCategory => {
  const type = file.type;
  if (type.startsWith('image/')) return FileCategory.IMAGE;
  if (type.startsWith('video/')) return FileCategory.VIDEO;
  if (file.name.endsWith('.apk')) return FileCategory.APK;
  if (type === 'application/pdf' || type.startsWith('text/') || type.includes('document')) return FileCategory.DOCUMENT;
  return FileCategory.OTHER;
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getRiskStyling = (risk: RiskType) => {
  switch (risk) {
    case RiskType.NSFW:
    case RiskType.SUSPICIOUS:
      return { bg: 'bg-danger/20', text: 'text-danger', icon: <WarningIcon className="w-4 h-4" /> };
    case RiskType.DOCUMENT:
    case RiskType.LARGE_FILE:
    case RiskType.DUPLICATE:
      return { bg: 'bg-warning/20', text: 'text-warning', icon: <DocumentTextIcon className="w-4 h-4" /> };
    case RiskType.SAFE:
    default:
      return { bg: 'bg-success/20', text: 'text-success', icon: <ShieldCheckIcon className="w-4 h-4" /> };
  }
};


// --- Sub-Components ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-secondary border border-border-color rounded-lg p-4 flex items-center">
    <div className="p-3 rounded-full bg-primary mr-4">{icon}</div>
    <div>
      <p className="text-sm text-text-secondary">{title}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  </div>
);

const FileCard: React.FC<{ scannedFile: ScannedFile; onDelete: (id: string) => void }> = ({ scannedFile, onDelete }) => {
  const { bg, text, icon } = getRiskStyling(scannedFile.risk);
  return (
    <div className="bg-secondary border border-border-color rounded-lg p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-3 mb-3">
          {scannedFile.previewUrl && scannedFile.category === FileCategory.IMAGE ? (
            <img src={scannedFile.previewUrl} alt={scannedFile.file.name} className="w-12 h-12 object-cover rounded-md" />
          ) : (
            <div className="w-12 h-12 bg-primary rounded-md flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-text-secondary" />
            </div>
          )}
          <div className="truncate flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">{scannedFile.file.name}</p>
            <p className="text-xs text-text-secondary">{formatBytes(scannedFile.file.size)}</p>
          </div>
        </div>
        <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${bg} ${text} mb-2`}>
          {icon}
          <span className="ml-2">{scannedFile.risk}</span>
        </div>
        <p className="text-xs text-text-secondary">{scannedFile.details}</p>
      </div>
      <button
        onClick={() => onDelete(scannedFile.id)}
        className="mt-4 w-full text-center text-sm text-danger font-semibold hover:bg-danger/20 py-1 rounded-md transition-colors"
      >
        Delete
      </button>
    </div>
  );
};


// --- Pages ---

const Dashboard: React.FC<{ scannedFiles: ScannedFile[] }> = ({ scannedFiles }) => {
  const threatsFound = scannedFiles.filter(f => f.risk !== RiskType.SAFE).length;
  const storageUsed = scannedFiles.reduce((acc, f) => acc + f.file.size, 0);
  const recentFiles = scannedFiles.slice(0, 5);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Files Scanned" value={scannedFiles.length} icon={<ShieldCheckIcon className="w-6 h-6 text-accent" />} />
        <StatCard title="Threats Found" value={threatsFound} icon={<WarningIcon className="w-6 h-6 text-danger" />} />
        <StatCard title="Storage Cleaned" value={formatBytes(storageUsed)} icon={<DocumentTextIcon className="w-6 h-6 text-warning" />} />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-4">Recently Scanned</h2>
      {recentFiles.length > 0 ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {recentFiles.map(file => (
            <FileCard key={file.id} scannedFile={file} onDelete={() => {}} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-secondary rounded-lg border border-border-color">
          <p className="text-text-secondary">No files scanned yet. Go to the Scanner to start.</p>
        </div>
      )}
    </div>
  );
};

const Scanner: React.FC<{ addScannedFile: (file: ScannedFile) => void; }> = ({ addScannedFile }) => {
  const [scanningFiles, setScanningFiles] = useState<File[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setScanningFiles(Array.from(event.target.files));
    }
  };
  
  const startScan = async () => {
    if (scanningFiles.length === 0) return;
    setIsScanning(true);
  
    for (const file of scanningFiles) {
      let risk = RiskType.SAFE;
      let details = "File appears safe.";
  
      if (file.type.startsWith('image/')) {
        const imageResult = await analyzeImage(file);
        risk = imageResult.risk;
        details = imageResult.details;
      } else {
        const nameResult = await analyzeFileName(file.name);
        risk = nameResult.risk;
        details = nameResult.details;
      }

      // Large file check
      if (file.size > 50 * 1024 * 1024 && risk === RiskType.SAFE) { // 50MB
        risk = RiskType.LARGE_FILE;
        details = "This is a large file."
      }
      
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
  
      const token = localStorage.getItem("token");

await fetch("http://localhost:5000/api/files/save", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    fileName: file.name,
    fileSize: file.size,
    previewUrl,
    risk,
    details,
    category: getFileCategory(file).toString(),
    scanDate: new Date(),
  }),
});

addScannedFile({
  id: `${file.name}-${Date.now()}`, // local UI
  file,
  previewUrl,
  risk,
  details,
  category:getFileCategory(file).toString(),
  scanDate: new Date(),
});

    }
  
    setIsScanning(false);
    setScanningFiles([]);
  };

  return (
    <div>
        <h1 className="text-3xl font-bold text-text-primary mb-6">Auto-Scan System</h1>
        <div className="bg-secondary border-2 border-dashed border-border-color rounded-lg p-8 text-center">
            <input type="file" id="file-upload" multiple onChange={handleFileChange} className="hidden" />
            <label htmlFor="file-upload" className="cursor-pointer">
                <UploadIcon className="w-16 h-16 mx-auto text-text-secondary mb-4" />
                <h2 className="text-xl font-semibold text-text-primary">
                  {scanningFiles.length > 0 ? `${scanningFiles.length} file(s) selected` : 'Click to browse or drag & drop files'}
                </h2>
                <p className="text-sm text-text-secondary mt-1">PNG, JPG, PDF, APK, etc.</p>
            </label>
            {scanningFiles.length > 0 && (
                <div className="mt-4 text-left max-h-40 overflow-y-auto bg-primary p-2 rounded-md">
                    {scanningFiles.map((file, index) => (
                        <p key={index} className="text-xs text-text-secondary truncate">{file.name}</p>
                    ))}
                </div>
            )}
        </div>
        <button
            onClick={startScan}
            disabled={isScanning || scanningFiles.length === 0}
            className="w-full mt-6 bg-accent text-white font-bold py-3 px-4 rounded-md hover:bg-blue-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
            {isScanning ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scanning...
                </>
            ) : 'Start Scan'}
        </button>
    </div>
  );
};


const GmailScanner: React.FC = () => {
  const [emails, setEmails] = useState<MockEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEmails = async () => {
      setIsLoading(true);
      const fetchedEmails = await fetchMockEmails();
      setEmails(fetchedEmails);
      setIsLoading(false);
    };
    loadEmails();
  }, []);

  const handleAttachmentDelete = async (emailId: string, attachmentId: string) => {
    await deleteMockAttachment(emailId, attachmentId);
    setEmails(prevEmails => prevEmails.map(email => {
      if (email.id === emailId) {
        return {
          ...email,
          attachments: email.attachments.filter(a => a.id !== attachmentId),
        };
      }
      return email;
    }));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Gmail Integration</h1>
      <div className="space-y-4">
        {isLoading ? (
          <p>Loading emails...</p>
        ) : (
          emails.map(email => (
            <div key={email.id} className="bg-secondary border border-border-color rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-text-primary">{email.subject}</p>
                  <p className="text-sm text-text-secondary">From: {email.sender}</p>
                </div>
                <p className="text-xs text-text-secondary">{email.date.toLocaleDateString()}</p>
              </div>
              {email.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border-color">
                  <h4 className="text-sm font-semibold mb-2 text-text-primary">Attachments:</h4>
                  <ul className="space-y-2">
                    {email.attachments.map(att => (
                      <li key={att.id} className={`flex items-center justify-between p-2 rounded-md ${att.isMalicious ? 'bg-danger/10' : 'bg-primary/50'}`}>
                        <div className="flex items-center space-x-2">
                          {att.isMalicious ? <WarningIcon className="w-5 h-5 text-danger"/> : <ShieldCheckIcon className="w-5 h-5 text-success"/>}
                          <div>
                            <p className="text-sm text-text-primary">{att.fileName}</p>
                            <p className="text-xs text-text-secondary">{formatBytes(att.fileSize)} - {att.isMalicious ? 'Suspicious' : 'Safe'}</p>
                          </div>
                        </div>
                        {att.isMalicious && (
                            <button onClick={() => handleAttachmentDelete(email.id, att.id)} className="text-xs bg-danger text-white px-2 py-1 rounded hover:bg-red-700">Auto-Delete</button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};


const FileManager: React.FC<{ scannedFiles: ScannedFile[]; setScannedFiles: React.Dispatch<React.SetStateAction<ScannedFile[]>> }> = ({ scannedFiles, setScannedFiles }) => {
  const [filter, setFilter] = useState<FileCategory | 'ALL'>('ALL');

  const handleDelete = (id: string) => {
    setScannedFiles(files => files.filter(f => f.id !== id));
  };
  
  const filteredFiles = useMemo(() => {
    if (filter === 'ALL') return scannedFiles;
    return scannedFiles.filter(f => f.category === filter);
  }, [scannedFiles, filter]);

  const categories = Object.values(FileCategory);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-4">File Management</h1>
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${filter === 'ALL' ? 'bg-accent text-white' : 'bg-secondary hover:bg-border-color'}`}>All</button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${filter === cat ? 'bg-accent text-white' : 'bg-secondary hover:bg-border-color'}`}>{cat}</button>
        ))}
      </div>
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map(file => (
            <FileCard key={file.id} scannedFile={file} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-secondary rounded-lg border border-border-color">
          <p className="text-text-secondary">No files found for this category.</p>
        </div>
      )}
    </div>
  );
};


const Reports: React.FC<{ scannedFiles: ScannedFile[] }> = ({ scannedFiles }) => {
    const riskData = useMemo(() => {
        const counts = scannedFiles.reduce((acc, file) => {
            acc[file.risk] = (acc[file.risk] || 0) + 1;
            return acc;
        }, {} as Record<RiskType, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [scannedFiles]);

    const categoryData = useMemo(() => {
        const counts = scannedFiles.reduce((acc, file) => {
            acc[file.category] = (acc[file.category] || 0) + 1;
            return acc;
        }, {} as Record<FileCategory, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [scannedFiles]);
    
    const totalFiles = scannedFiles.length;
    const threatsFound = scannedFiles.filter(f => f.risk !== RiskType.SAFE).length;
    const securityScore = totalFiles > 0 ? Math.round(((totalFiles - threatsFound) / totalFiles) * 100) : 100;

    const COLORS = {
        [RiskType.SAFE]: '#28A745',
        [RiskType.SUSPICIOUS]: '#DC3545',
        [RiskType.NSFW]: '#b91c1c',
        [RiskType.DOCUMENT]: '#FFC107',
        [RiskType.DUPLICATE]: '#fdba74',
        [RiskType.LARGE_FILE]: '#60a5fa',
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary mb-6">Security Reports</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 bg-secondary border border-border-color rounded-lg p-6 flex flex-col items-center justify-center">
                    <div className={`relative w-40 h-40 rounded-full flex items-center justify-center bg-primary`}>
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-border-color"
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="currentColor" strokeWidth="3" />
                            <path className={`${securityScore > 80 ? 'text-success' : securityScore > 50 ? 'text-warning' : 'text-danger'}`}
                                strokeDasharray={`${securityScore}, 100`}
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="currentColor" strokeWidth="3" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-4xl font-bold">{securityScore}</span>
                            <span className="text-sm text-text-secondary">Security Score</span>
                        </div>
                    </div>
                    <p className="mt-4 text-center text-text-secondary">A higher score means your device is better protected.</p>
                </div>
                <div className="lg:col-span-2 bg-secondary border border-border-color rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4">Scan Summary</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={categoryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#8B949E" fontSize={12} />
                            <YAxis stroke="#8B949E" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #30363D' }} />
                            <Legend />
                            <Bar dataKey="value" name="Files" fill="#58A6FF" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-secondary border border-border-color rounded-lg p-6">
                 <h3 className="font-bold text-lg mb-4">Detections by Risk Type</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {riskData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name as RiskType] || '#8884d8'} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #30363D' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const Settings: React.FC = () => {
  const SettingToggle: React.FC<{ title: string; description: string; enabled: boolean }> = ({ title, description, enabled }) => {
    const [isOn, setIsOn] = useState(enabled);
    return (
      <div className="flex items-center justify-between py-4 border-b border-border-color">
        <div>
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
        <button
          onClick={() => setIsOn(!isOn)}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isOn ? 'bg-accent' : 'bg-gray-600'}`}
        >
          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    );
  };
    
  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Settings & Permissions</h1>
      <div className="bg-secondary border border-border-color rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2">Permissions</h2>
        <SettingToggle title="Storage/File Access" description="Required to scan files on your device." enabled={true} />
        <SettingToggle title="Notification Access" description="Get alerts for completed scans and threats." enabled={false} />
        <SettingToggle title="Gmail API Permission" description="Allow access to scan email attachments." enabled={true} />
        <SettingToggle title="Background Operation" description="Allow periodic scans in the background." enabled={false} />
        
        <h2 className="text-xl font-bold mt-8 mb-2">Security</h2>
        <SettingToggle title="App Lock" description="Lock the app with a PIN." enabled={true} />
        <SettingToggle title="Cloud Sync" description="Sync scan history and reports across devices." enabled={false} />
      </div>
    </div>
  );
};


export const MainContent: React.FC<{ activeView: string; scannedFiles: ScannedFile[]; setScannedFiles: React.Dispatch<React.SetStateAction<ScannedFile[]>> }> = ({ activeView, scannedFiles, setScannedFiles }) => {
  const addScannedFile = (file: ScannedFile) => {
    setScannedFiles(prev => [file, ...prev]);
  };
  
  const renderView = () => {
    switch (activeView) {
      case 'Dashboard':
        return <Dashboard scannedFiles={scannedFiles} />;
      case 'Scanner':
        return <Scanner addScannedFile={addScannedFile} />;
      case 'Gmail':
        return <GmailScanner />;
      case 'File Manager':
        return <FileManager scannedFiles={scannedFiles} setScannedFiles={setScannedFiles} />;
      case 'Reports':
        return <Reports scannedFiles={scannedFiles} />;
      case 'Settings':
        return <Settings />;
      default:
        return <Dashboard scannedFiles={scannedFiles} />;
    }
  };

  return <div className="p-4 sm:p-6 lg:p-8">{renderView()}</div>;
};
