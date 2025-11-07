

import React, { useState, useEffect, createContext, useContext, useMemo, useCallback, forwardRef, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import {
    X, MapPin, Grid, Users, FileText, Sun, Moon, Bell, LogOut, PlusCircle, Search, Copy, Upload,
    Edit, Trash2, FileDown, Bot, Send, BrainCircuit, Zap, Loader, ArrowRight, DollarSign, UserCheck, UserX
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { GoogleGenAI } from '@google/genai';


// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyAEAnhu4mzqnRKu5yRv4mh7PKCmwi5IeWA",
    authDomain: "gps-tracker-cobros.firebaseapp.com",
    projectId: "gps-tracker-cobros",
    storageBucket: "gps-tracker-cobros.appspot.com",
    messagingSenderId: "1072959630335",
    appId: "1:1072959630335:web:d498eea7f4135835acd5ca"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- Toaster (Notifications) ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toaster-container');
    if (!container) return;
    const isDark = document.documentElement.classList.contains('dark');
    const toastElement = document.createElement('div');
    toastElement.className = `toast toast-${type} ${isDark ? 'dark' : ''}`;
    toastElement.textContent = message;
    container.appendChild(toastElement);
    setTimeout(() => toastElement.classList.add('show'), 10);
    setTimeout(() => {
        toastElement.classList.remove('show');
        setTimeout(() => toastElement.remove(), 300);
    }, 4000);
}
const toast = {
    success: (message) => showToast(message, 'success'),
    error: (message) => showToast(message, 'error'),
};

// --- UI Components ---
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 ${className}`}>{children}</div>;
const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    children: React.ReactNode;
}
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ children, className = '', variant = 'primary', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-4 py-2';
    const variants = { primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600', secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600', danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500', ghost: 'hover:bg-slate-100 dark:hover:bg-slate-700', };
    return <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
});

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}
const Input = forwardRef<HTMLInputElement, InputProps>(({ label, id, ...props }, ref) => <div><label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label><input ref={ref} id={id} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" {...props} /></div>);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    children: React.ReactNode;
}
const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, id, children, ...props }, ref) => <div><label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label><select ref={ref} id={id} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" {...props}>{children}</select></div>);

const Badge = ({ children, color }: { children: React.ReactNode; color: 'green' | 'yellow' | 'red' | 'gray' }) => {
    const colors = { green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', gray: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300', };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>;
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <Button variant="ghost" onClick={onClose} className="!p-1 h-auto"><X size={20} /></Button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, id, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <textarea ref={ref} id={id} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" {...props} />
    </div>
));

// --- Types (Enums) ---
const PaymentFrequency = { Monthly: 'Mensual', Annual: 'Anual' };
const PaymentStatus = { Paid: 'Pagado', Pending: 'Pendiente', Overdue: 'Vencido' };
const ServiceType = { GPS_SALE: 'GPS - Venta', GPS_RENTAL: 'GPS - Alquiler', PORTABLE_GPS_SALE: 'GPS Portátil - Venta', PORTABLE_GPS_RENTAL: 'GPS Portátil - Alquiler' };

// --- App Contexts ---
const AuthContext = createContext(null);
const DataContext = createContext(null);

// --- Auth Provider ---
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

// --- Firestore Data Hook ---
function useFirestoreData(userId) {
    const [clients, setClients] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const convertTimestamps = (data) => {
        const convertedData = {};
        for (const key in data) {
            if (data[key] instanceof firebase.firestore.Timestamp) {
                convertedData[key] = data[key].toDate().toISOString();
            } else {
                convertedData[key] = data[key];
            }
        }
        return convertedData;
    };

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            setClients([]);
            setPayments([]);
            return;
        }
        setLoading(true);
        const clientsQuery = db.collection('clients').where('userId', '==', userId);
        const unsubscribeClients = clientsQuery.onSnapshot(
            snapshot => {
                setClients(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) })));
                setLoading(false);
            },
            error => {
                console.error("Error fetching clients:", error);
                toast.error("Error al cargar clientes.");
                setLoading(false);
            }
        );

        const paymentsQuery = db.collection('payments').where('userId', '==', userId);
        const unsubscribePayments = paymentsQuery.onSnapshot(
            snapshot => {
                setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) })));
            },
            error => {
                console.error("Error fetching payments:", error);
                toast.error("Error al cargar pagos.");
            }
        );
        return () => {
            unsubscribeClients();
            unsubscribePayments();
        };
    }, [userId]);

    const addClient = (clientData) => db.collection('clients').add({ ...clientData, userId, registrationDate: firebase.firestore.FieldValue.serverTimestamp() });
    const updateClient = ({ id, ...data }) => db.collection('clients').doc(id).update(data);
    const deleteClient = (clientId) => db.collection('clients').doc(clientId).delete();
    const addPayment = (paymentData) => db.collection('payments').add({ ...paymentData, userId, paymentDate: new Date(paymentData.paymentDate) });
    const getClientById = useCallback((clientId) => clients.find(c => c.id === clientId), [clients]);
    const addMultipleClients = async (clientsData) => {
        const batch = db.batch();
        clientsData.forEach(client => {
            const docRef = db.collection("clients").doc();
            const paymentDate = new Date(client.nextPaymentDate);
            const adjustedDate = new Date(paymentDate.getTime() + (paymentDate.getTimezoneOffset() * 60000));
            batch.set(docRef, { ...client, nextPaymentDate: adjustedDate, userId, registrationDate: firebase.firestore.FieldValue.serverTimestamp() });
        });
        await batch.commit();
    };

    return { clients, payments, loading, addClient, updateClient, deleteClient, addPayment, getClientById, addMultipleClients };
}

// --- Gemini Service ---
const getChatbotResponse = async (history, newMessage, isThinkingMode, clients, payments) => {
    try {
        const modelName = isThinkingMode ? "gemini-2.5-pro" : "gemini-2.5-flash";
        const dataContext = `Contexto de Datos (JSON):\nClientes: ${JSON.stringify(clients, null, 2)}\nPagos: ${JSON.stringify(payments, null, 2)}`;
        const systemInstruction = `Eres un asistente experto para "GPS Tracker Panama". Tu rol es ayudar al usuario a gestionar los datos de sus clientes y pagos. Eres amigable, conciso y profesional. Analiza los datos JSON proporcionados para responder preguntas. La fecha de hoy es ${new Date().toLocaleDateString()}.`;
        
        const contents = `${systemInstruction}\n${dataContext}\n\nHistorial de Conversación:\n${history.map(h => `${h.role}: ${h.parts[0].text}`).join('\n')}\n\nPregunta Actual:\nuser: ${newMessage}`;

        const config: any = {};
        if (isThinkingMode) {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }
        
        const response = await genAI.models.generateContent({
            model: modelName,
            contents: contents,
            config: config,
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        toast.error("Error de comunicación con la IA. Revisa la API Key.");
        return "Lo siento, no pude procesar tu solicitud en este momento.";
    }
};


// --- App Components ---

const DashboardComponent = ({ setView }) => {
    const { clients } = useContext(DataContext);

    const getClientPaymentStatus = useCallback((client, today) => {
        const nextPaymentDate = new Date(client.nextPaymentDate);
        if (nextPaymentDate < today) return PaymentStatus.Overdue;
        const daysUntilPayment = (nextPaymentDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return daysUntilPayment <= 15 ? PaymentStatus.Pending : PaymentStatus.Paid;
    }, []);

    const stats = useMemo(() => {
        if (!clients) return { totalClients: 0, monthlyRevenue: 0, paid: 0, pending: 0, overdue: 0 };
        const today = new Date();
        const clientStatus = clients.map(c => getClientPaymentStatus(c, today));
        return {
            totalClients: clients.length,
            // FIX: Explicitly type the accumulator in reduce to prevent type errors.
            monthlyRevenue: clients.reduce((acc: number, c) => c.paymentFrequency === PaymentFrequency.Monthly ? acc + Number(c.paymentAmount) : acc, 0),
            paid: clientStatus.filter(s => s === PaymentStatus.Paid).length,
            pending: clientStatus.filter(s => s === PaymentStatus.Pending).length,
            overdue: clientStatus.filter(s => s === PaymentStatus.Overdue).length,
        };
    }, [clients, getClientPaymentStatus]);

    const chartData = [ { name: PaymentStatus.Paid, value: stats.paid }, { name: PaymentStatus.Pending, value: stats.pending }, { name: PaymentStatus.Overdue, value: stats.overdue }, ];
    const COLORS = { [PaymentStatus.Paid]: '#22c55e', [PaymentStatus.Pending]: '#f59e0b', [PaymentStatus.Overdue]: '#ef4444' };

    const upcomingPayments = clients
        .filter(c => getClientPaymentStatus(c, new Date()) === PaymentStatus.Pending)
        .sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardContent><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Total de Clientes</p><p className="text-2xl font-bold">{stats.totalClients}</p></div><div className="p-3 bg-primary-100 rounded-lg"><Users className="text-primary-500" /></div></div></CardContent></Card>
                <Card><CardContent><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Ingreso Mensual Est.</p><p className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p></div><div className="p-3 bg-primary-100 rounded-lg"><DollarSign className="text-primary-500" /></div></div></CardContent></Card>
                <Card><CardContent><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Activos y Pendientes</p><p className="text-2xl font-bold">{stats.paid + stats.pending}</p></div><div className="p-3 bg-primary-100 rounded-lg"><UserCheck className="text-primary-500" /></div></div></CardContent></Card>
                <Card><CardContent><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Pagos Vencidos</p><p className="text-2xl font-bold">{stats.overdue}</p></div><div className="p-3 bg-primary-100 rounded-lg"><UserX className="text-primary-500" /></div></div></CardContent></Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader><h3 className="font-semibold">Resumen de Estado de Pagos</h3></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {chartData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="font-semibold">Próximos Pagos</h3></CardHeader>
                    <CardContent>{upcomingPayments.length > 0 ? <ul className="space-y-3">{upcomingPayments.map(c => <li key={c.id} className="flex justify-between items-center"><div><p className="font-medium">{c.name}</p><p className="text-sm text-slate-500">Vence: {new Date(c.nextPaymentDate).toLocaleDateString()}</p></div><p>${c.paymentAmount.toLocaleString()}</p></li>)}</ul> : <p>No hay pagos próximos.</p>}</CardContent>
                </Card>
            </div>
        </div>
    );
};

const ClientManagementComponent = () => {
    const context = useContext(DataContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<any>(null);
    const [statementClient, setStatementClient] = useState<any>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    const isClientActive = (client) => {
        // FIX: Use .getTime() for explicit number conversion to prevent type errors.
        const diffDays = (new Date().getTime() - new Date(client.nextPaymentDate).getTime()) / (1000 * 3600 * 24);
        return diffDays <= 60;
    };

    const filteredClients = useMemo(() => {
        if (!context?.clients) return [];
        return context.clients.filter(client =>
            // FIX: Add safe-guards to prevent runtime errors if client properties are not strings.
            (((client.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.ruc && client.ruc.toString().includes(searchQuery)))) &&
            (statusFilter === 'all' || (statusFilter === 'active' ? isClientActive(client) : !isClientActive(client)))
        );
    }, [context, searchQuery, statusFilter]);

    if (!context) return null;

    const { addClient, updateClient, deleteClient, payments, addMultipleClients } = context;

    const handleSave = (clientData) => {
        if (clientData.id) {
            updateClient(clientData).then(() => toast.success('¡Cliente actualizado!'));
        } else {
            addClient(clientData).then(() => toast.success('¡Cliente añadido!'));
        }
        setIsModalOpen(false);
    };

    const confirmDelete = () => {
        if (clientToDelete) {
            deleteClient(clientToDelete).then(() => toast.success('¡Cliente eliminado!'));
        }
        setIsDeleteModalOpen(false);
        setClientToDelete(null);
    };
    
    const handleCopyForSheets = () => {
        const header = ['Nombre', 'RUC', 'Teléfono', 'Correo Electrónico', 'Tipo de Servicio', 'Unidades GPS', 'Monto de Pago', 'Frecuencia de Pago', 'Próxima Fecha de Pago'].join('\t');
        const rows = filteredClients.map(c => [ c.name, c.ruc || '', c.phone, c.email, c.serviceType, c.gpsUnits, c.paymentAmount, c.paymentFrequency, new Date(c.nextPaymentDate).toISOString().split('T')[0] ].join('\t')).join('\n');
        navigator.clipboard.writeText(header + '\n' + rows).then(() => toast.success('Datos copiados.'), () => toast.error('Error al copiar.'));
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Buscar clientes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md dark:bg-slate-700" /></div>
                        <Select label="" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></Select>
                    </div>
                    <div className="flex items-center space-x-2"><Button variant="secondary" onClick={handleCopyForSheets}><Copy className="mr-2 h-4 w-4" />Copiar</Button><Button variant="secondary" onClick={() => setIsImportModalOpen(true)}><Upload className="mr-2 h-4 w-4" />Importar</Button><Button onClick={() => { setEditingClient(undefined); setIsModalOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Nuevo</Button></div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700"><tr><th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Contacto</th><th className="px-6 py-3">Plan</th><th className="px-6 py-3">Próximo Pago</th><th className="px-6 py-3">Estado</th><th className="px-6 py-3 text-right">Acciones</th></tr></thead>
                            <tbody>
                                {filteredClients.map(client => <tr key={client.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                    <td className="px-6 py-4 font-medium">{client.name}</td>
                                    <td className="px-6 py-4"><div>{client.phone}</div><div>{client.email}</div></td>
                                    <td className="px-6 py-4"><div>${client.paymentAmount}/{client.paymentFrequency === PaymentFrequency.Monthly ? 'mes' : 'año'}</div><div className="text-sm text-slate-500">{client.gpsUnits} unidades</div></td>
                                    <td className="px-6 py-4">{new Date(client.nextPaymentDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4"><Badge color={isClientActive(client) ? 'green' : 'gray'}>{isClientActive(client) ? 'Activo' : 'Inactivo'}</Badge></td>
                                    <td className="px-6 py-4 text-right"><div className="flex justify-end space-x-1"><Button variant="ghost" className="!p-2 h-auto" onClick={() => setStatementClient(client)}><FileText size={16} /></Button><Button variant="ghost" className="!p-2 h-auto" onClick={() => { setEditingClient(client); setIsModalOpen(true); }}><Edit size={16} /></Button><Button variant="ghost" className="!p-2 h-auto text-red-500" onClick={() => { setClientToDelete(client.id); setIsDeleteModalOpen(true); }}><Trash2 size={16} /></Button></div></td>
                                </tr>)}
                            </tbody>
                        </table>
                        {filteredClients.length === 0 && <p className="text-center py-8 text-slate-500">No se encontraron clientes.</p>}
                    </div>
                </CardContent>
            </Card>
            <ClientFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} client={editingClient} onSave={handleSave} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} />
            {statementClient && <StatementModal client={statementClient} payments={payments} onClose={() => setStatementClient(null)} />}
            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={addMultipleClients} />
        </>
    );
};

const ClientFormModal = ({ isOpen, onClose, client, onSave }) => {
    const [formData, setFormData] = useState<any>({});
    useEffect(() => { setFormData(client ? { ...client, nextPaymentDate: new Date(client.nextPaymentDate).toISOString().split('T')[0] } : { gpsUnits: 1, paymentFrequency: PaymentFrequency.Monthly, serviceType: ServiceType.GPS_RENTAL, nextPaymentDate: new Date().toISOString().split('T')[0] }) }, [client, isOpen]);
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); const paymentDate = new Date(formData.nextPaymentDate); const adjustedDate = new Date(paymentDate.getTime() + (paymentDate.getTimezoneOffset() * 60000)); onSave({ ...formData, gpsUnits: Number(formData.gpsUnits), paymentAmount: Number(formData.paymentAmount), nextPaymentDate: adjustedDate.toISOString() }); };
    return <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}><form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre o Empresa" name="name" value={formData.name || ''} onChange={handleChange} required />
            <Input label="RUC (Opcional)" name="ruc" value={formData.ruc || ''} onChange={handleChange} />
            <Input label="Teléfono" name="phone" value={formData.phone || ''} onChange={handleChange} required />
            <Input label="Correo Electrónico" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />
            <Select label="Tipo de Servicio" name="serviceType" value={formData.serviceType} onChange={handleChange}>{Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}</Select>
            <Input label="Unidades GPS" name="gpsUnits" type="number" value={formData.gpsUnits || ''} onChange={handleChange} required min="1" />
            <Input label="Monto de Pago ($)" name="paymentAmount" type="number" value={formData.paymentAmount || ''} onChange={handleChange} required min="0" />
            <Select label="Frecuencia de Pago" name="paymentFrequency" value={formData.paymentFrequency} onChange={handleChange}><option value={PaymentFrequency.Monthly}>Mensual</option><option value={PaymentFrequency.Annual}>Anual</option></Select>
            <Input label="Próxima Fecha de Pago" name="nextPaymentDate" type="date" value={formData.nextPaymentDate || ''} onChange={handleChange} required />
        </div>
        <div className="flex justify-end space-x-2"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">{client ? 'Actualizar' : 'Crear'}</Button></div>
    </form></Modal>;
};
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Eliminación"><p>¿Está seguro? Esta acción no se puede deshacer.</p><div className="flex justify-end space-x-2 mt-4"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button variant="danger" onClick={onConfirm}>Eliminar</Button></div></Modal>;
const StatementModal = ({ client, payments, onClose }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const clientPayments = payments.filter(p => p.clientId === client.id && new Date(p.paymentDate).getFullYear() === year);
    
    const getYearsWithPayments = useMemo(() => {
        const years = new Set(payments.filter(p => p.clientId === client.id).map(p => new Date(p.paymentDate).getFullYear()));
        const currentYear = new Date().getFullYear();
        if(!years.has(currentYear)) years.add(currentYear);
        return Array.from(years).sort((a,b) => b-a);
    }, [payments, client.id]);

    const generatePdf = () => {
        const doc = new jsPDF();
        doc.text(`Estado de Cuenta: ${client.name} (${year})`, 14, 22);
        (doc as any).autoTable({
            head: [['Fecha de Pago', 'Monto del Pago']],
            body: clientPayments.map(p => [new Date(p.paymentDate).toLocaleDateString(), `$${p.amount}`]),
            startY: 30
        });
        doc.save(`Estado_de_Cuenta_${client.name}_${year}.pdf`);
    };
    return <Modal isOpen={true} onClose={onClose} title="Estado de Cuenta"><div className="space-y-4">
        <Select label="Año" value={year} onChange={e => setYear(Number(e.target.value))}>
            {getYearsWithPayments.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Button onClick={generatePdf} disabled={clientPayments.length === 0}><FileDown className="mr-2 h-4 w-4" />Descargar PDF</Button>
        <div className="overflow-auto max-h-64"><table className="w-full text-sm">
            <thead><tr><th className="text-left py-2">Fecha</th><th className="text-left py-2">Monto</th></tr></thead>
            <tbody>{clientPayments.length > 0 ? clientPayments.map(p => <tr key={p.id} className="border-t dark:border-slate-700"><td className="py-2">{new Date(p.paymentDate).toLocaleDateString()}</td><td className="py-2">${p.amount}</td></tr>) : <tr><td colSpan={2} className="text-center py-4">No hay pagos para este año.</td></tr>}</tbody>
        </table></div>
    </div></Modal>;
};
const ImportModal = ({ isOpen, onClose, onImport }) => {
    const [data, setData] = useState('');
    const handleImport = () => {
        try {
            const lines = data.trim().split('\n').slice(1);
            const clients = lines.map(line => {
                const [name, ruc, phone, email, serviceType, gpsUnits, paymentAmount, paymentFrequency, nextPaymentDate] = line.split('\t');
                return { name, ruc, phone, email, serviceType, gpsUnits: Number(gpsUnits), paymentAmount: Number(paymentAmount), paymentFrequency, nextPaymentDate };
            });
            onImport(clients).then(() => { toast.success(`${clients.length} clientes importados.`); onClose(); });
        } catch (e) { toast.error("Error al procesar los datos."); }
    };
    return <Modal isOpen={isOpen} onClose={onClose} title="Importar Clientes"><p className="text-sm">Pegue los datos desde su hoja de cálculo (incluyendo encabezado).</p><Textarea label="Datos a importar" value={data} onChange={e => setData(e.target.value)} rows={10} /><div className="flex justify-end space-x-2 mt-4"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={handleImport}>Importar</Button></div></Modal>;
};

const PaymentManagementComponent = () => {
    const context = useContext(DataContext);
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [statusFilter, setStatusFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<any>(undefined);

    const getClientPaymentStatusForMonth = useCallback((client, month, year, payments) => {
        const today = new Date();
        const paymentForPeriod = payments.find(p => p.clientId === client.id && Number(p.month) === month && Number(p.year) === year);
        if (paymentForPeriod) return { status: PaymentStatus.Paid, payment: paymentForPeriod };
        
        const clientRegYear = new Date(client.registrationDate).getFullYear();
        const clientRegMonth = new Date(client.registrationDate).getMonth() + 1;
        if (year < clientRegYear || (year === clientRegYear && month < clientRegMonth)) {
             return { status: PaymentStatus.Paid, payment: null };
        }

        const dueDateDay = new Date(client.nextPaymentDate).getUTCDate();
        const dueDateForMonth = new Date(Date.UTC(year, month - 1, dueDateDay));
        
        if (new Date() > dueDateForMonth) return { status: PaymentStatus.Overdue, payment: null };
        return { status: PaymentStatus.Pending, payment: null };
    }, []);

    const clientsWithStatus = useMemo(() => {
        if (!context?.clients) return [];
        return context.clients.map(client => ({ client, ...getClientPaymentStatusForMonth(client, filterMonth, filterYear, context.payments) }))
            .filter(item => statusFilter === 'All' || item.status === statusFilter);
    }, [context, filterMonth, filterYear, statusFilter, getClientPaymentStatusForMonth]);

    if (!context) return null;
    const { addPayment, updateClient, getClientById } = context;

    const handleSave = (paymentData) => {
        addPayment(paymentData).then(() => {
            toast.success('Pago registrado.');
            const client = getClientById(paymentData.clientId);
            if (client) {
                const currentNextPayment = new Date(client.nextPaymentDate);
                const isCurrentBillingPeriod = (client.paymentFrequency === PaymentFrequency.Monthly && paymentData.month === (currentNextPayment.getUTCMonth() + 1) && paymentData.year === currentNextPayment.getUTCFullYear()) ||
                                           (client.paymentFrequency === PaymentFrequency.Annual && paymentData.year === currentNextPayment.getUTCFullYear());

                if (isCurrentBillingPeriod) {
                    let newNextPaymentDate = new Date(client.nextPaymentDate);
                    if(client.paymentFrequency === PaymentFrequency.Annual) {
                        newNextPaymentDate.setUTCFullYear(newNextPaymentDate.getUTCFullYear() + 1);
                    } else {
                        newNextPaymentDate.setUTCMonth(newNextPaymentDate.getUTCMonth() + 1);
                    }
                    updateClient({ id: client.id, nextPaymentDate: newNextPaymentDate.toISOString() });
                }
            }
        });
        setIsModalOpen(false);
    };

    const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const getYears = () => { const currentYear = new Date().getFullYear(); return [currentYear + 1, currentYear, currentYear - 1, currentYear - 2]; }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Select label="" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>{MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</Select>
                        <Select label="" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>{getYears().map(y => <option key={y} value={y}>{y}</option>)}</Select>
                        <Select label="" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="All">Todos</option><option value={PaymentStatus.Paid}>Pagado</option><option value={PaymentStatus.Pending}>Pendiente</option><option value={PaymentStatus.Overdue}>Vencido</option></Select>
                    </div>
                    <Button onClick={() => { setPaymentDetails(undefined); setIsModalOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Registrar Pago</Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700"><tr><th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Estado</th><th className="px-6 py-3">Monto</th><th className="px-6 py-3">Fecha de Pago</th><th className="px-6 py-3 text-right">Acción</th></tr></thead>
                            <tbody>
                                {clientsWithStatus.map(({client, status, payment}) => <tr key={client.id} className="border-b dark:border-slate-700">
                                    <td className="px-6 py-4">{client.name}</td>
                                    <td className="px-6 py-4"><Badge color={status === PaymentStatus.Paid ? 'green' : status === PaymentStatus.Pending ? 'yellow' : 'red'}>{status}</Badge></td>
                                    <td className="px-6 py-4">${client.paymentAmount}</td>
                                    <td className="px-6 py-4">{payment ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4 text-right">{status !== PaymentStatus.Paid && <Button onClick={() => { setPaymentDetails({ client, month: filterMonth, year: filterYear }); setIsModalOpen(true); }}>Registrar</Button>}</td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <PaymentFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} details={paymentDetails} clients={context.clients} />
        </>
    );
};
const PaymentFormModal = ({ isOpen, onClose, onSave, details, clients }) => {
    const [formData, setFormData] = useState<any>({});
    useEffect(() => {
        if (isOpen) {
            if (details) {
                setFormData({ clientId: details.client.id, amount: details.client.paymentAmount, month: details.month, year: details.year, paymentDate: new Date().toISOString().split('T')[0] });
            } else if (clients?.length > 0) {
                setFormData({ clientId: clients[0].id, amount: clients[0].paymentAmount, month: new Date().getMonth() + 1, year: new Date().getFullYear(), paymentDate: new Date().toISOString().split('T')[0] });
            }
        }
    }, [details, clients, isOpen]);
    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave({...formData, amount: Number(formData.amount), month: Number(formData.month), year: Number(formData.year)}); };
    return <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago"><form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Cliente" name="clientId" value={formData.clientId || ''} onChange={handleChange} disabled={!!details}>{(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Input label="Monto" name="amount" type="number" value={formData.amount || ''} onChange={handleChange} required />
        <Input label="Fecha de Pago" name="paymentDate" type="date" value={formData.paymentDate || ''} onChange={handleChange} required />
        <Input label="Mes del Pago" name="month" type="number" value={formData.month || ''} onChange={handleChange} required />
        <Input label="Año del Pago" name="year" type="number" value={formData.year || ''} onChange={handleChange} required />
        <div className="flex justify-end space-x-2"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar</Button></div>
    </form></Modal>;
};


const ChatbotComponent = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ id: 1, text: "¡Hola! ¿Cómo puedo ayudarte?", role: 'model' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isThinkingMode, setIsThinkingMode] = useState(false);
    const dataContext = useContext(DataContext);
    const messagesEndRef = useRef(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading || !dataContext) return;
        
        const newMessages = [...messages, { id: Date.now(), text: input, role: 'user' }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        const historyForApi = newMessages.slice(1).map(({ role, text }) => ({ role, parts: [{ text }] }));
        
        const botResponseText = await getChatbotResponse(historyForApi, input, isThinkingMode, dataContext.clients, dataContext.payments);
        
        setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponseText, role: 'model' }]);
        setIsLoading(false);
    };

    return (
        <>
            <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg z-50">{isOpen ? <X /> : <Bot />}</button>
            {isOpen && <div className="fixed bottom-20 right-6 w-[calc(100%-3rem)] sm:w-96 h-[60vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col z-40 animate-fade-in-up">
                <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                    <div><h3 className="font-semibold">Asistente de IA</h3><div className="flex items-center text-xs text-slate-500">{isThinkingMode ? <BrainCircuit size={14} className="mr-1" /> : <Zap size={14} className="mr-1" />} {isThinkingMode ? "Modo Pensamiento" : "Modo Rápido"}</div></div>
                    <div className="flex items-center"><span className="text-sm mr-2">Pro</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={isThinkingMode} onChange={() => setIsThinkingMode(!isThinkingMode)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div></label></div>
                </header>
                <main className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map(msg => <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}><div className={`px-4 py-2 rounded-lg max-w-xs ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>{msg.text}</div></div>)}
                    {isLoading && <Loader className="animate-spin text-primary-500" />}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t dark:border-slate-700"><div className="relative"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribe un mensaje..." className="w-full pl-3 pr-12 py-2 border rounded-lg dark:bg-slate-700" disabled={isLoading} /><button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-primary-500"><Send /></button></div></footer>
            </div>}
        </>
    );
};
        const AuthComponent = () => { const [isLogin, setIsLogin] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [isLoading, setIsLoading] = useState(false); const getFirebaseErrorMessage = (error) => ({ 'auth/user-not-found': 'Usuario no encontrado.', 'auth/wrong-password': 'Contraseña incorrecta.', 'auth/invalid-email': 'Correo inválido.', 'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.', 'auth/email-already-in-use': 'El correo electrónico ya está en uso.' }[error.code] || 'Ocurrió un error. Inténtalo de nuevo.'); const handleSubmit = async (e) => { e.preventDefault(); setIsLoading(true); try { if (isLogin) { await auth.signInWithEmailAndPassword(email, password); } else { await auth.createUserWithEmailAndPassword(email, password); } toast.success(isLogin ? '¡Bienvenido de nuevo!' : '¡Cuenta creada exitosamente!'); } catch (error) { toast.error(getFirebaseErrorMessage(error)); } finally { setIsLoading(false); } }; return ( <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4"> <Card className="w-full max-w-md"> <CardHeader className="text-center"> <div className="flex items-center justify-center mb-4"><MapPin className="text-primary-500 h-8 w-8" /><h1 className="ml-2 text-2xl font-bold">GPS Tracker Panama</h1></div> <h2 className="text-xl font-semibold">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2> </CardHeader> <CardContent> <form onSubmit={handleSubmit} className="space-y-4"> <Input label="Correo Electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /> <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /> <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader className="animate-spin" /> : (isLogin ? 'Ingresar' : 'Crear Cuenta')}</Button> </form> <div className="mt-4 text-center"><button onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary-600 hover:underline dark:text-primary-400">{isLogin ? '¿No tienes una cuenta? Crear una' : '¿Ya tienes una cuenta? Iniciar Sesión'}</button></div> </CardContent> </Card> </div> ); };
        const Layout = ({ children }) => <div className="flex h-screen">{children}</div>;
        const Sidebar = ({ currentView, setView, navigationItems }) => ( <aside className="w-64 bg-white dark:bg-slate-800/50 border-r flex-col hidden lg:flex"><div className="h-16 flex items-center px-6 border-b"><MapPin className="text-primary-500" /><h1 className="ml-2 text-xl font-bold">GPS Tracker</h1></div><nav className="flex-1 px-4 py-4"><ul>{navigationItems.map(item => (<li key={item.name}><button onClick={() => setView(item.view)} className={`w-full flex items-center px-4 py-2 my-1 rounded-lg text-sm ${currentView === item.view ? 'bg-primary-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}><item.icon className="mr-3 h-5 w-5" />{item.name}</button></li>))}</ul></nav></aside> );
        const Header = ({ currentView, navigationItems }) => { const { user } = useContext(AuthContext); const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark')); const toggleDarkMode = () => { document.documentElement.classList.toggle('dark'); setIsDark(!isDark); }; const viewName = navigationItems.find(item => item.view === currentView)?.name; return ( <header className="h-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b flex items-center justify-between px-6"><h2 className="text-xl font-semibold capitalize">{viewName}</h2><div className="flex items-center space-x-2"><span className="text-sm hidden sm:inline">{user?.email}</span><button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button><Button variant="secondary" onClick={() => auth.signOut()} className="!px-2"><LogOut size={20} /></Button></div></header> ); };

        // --- The Main App ---
        const App = () => { const { user, loading } = useContext(AuthContext); const [view, setView] = useState('dashboard'); const data = useFirestoreData(user?.uid); if (loading) return <div className="flex items-center justify-center h-screen"><Loader className="w-12 h-12 animate-spin text-primary-500" /></div>; if (!user) return <AuthComponent />; const navigationItems = [ { name: 'Panel', icon: Grid, view: 'dashboard' }, { name: 'Clientes', icon: Users, view: 'clients' }, { name: 'Pagos', icon: FileText, view: 'payments' } ]; return ( <DataContext.Provider value={data}> <Layout> <Sidebar currentView={view} setView={setView} navigationItems={navigationItems} /> <div className="flex flex-col flex-1"> <Header currentView={view} navigationItems={navigationItems} /> <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto"> {data.loading && <div className="flex items-center justify-center h-full"><Loader className="w-8 h-8 animate-spin text-primary-500" /></div>} {!data.loading && view === 'dashboard' && <DashboardComponent setView={setView} />} {!data.loading && view === 'clients' && <ClientManagementComponent />} {!data.loading && view === 'payments' && <PaymentManagementComponent />} </main> </div> </Layout> <ChatbotComponent /> </DataContext.Provider> ); };

        const RootApp = () => ( <AuthProvider><App /></AuthProvider> );
        const root = createRoot(document.getElementById('root'));
        root.render(<RootApp />);
// FIX: Removed invalid HTML tags from the end of the TSX file.
