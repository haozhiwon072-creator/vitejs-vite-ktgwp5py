import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Settings, 
  TrendingUp, 
  Plus, 
  Save, 
  Search, 
  Printer, 
  Calendar,
  History,
  Store,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  AlertTriangle,
  Database,
  Loader,
  X,
  CheckCircle,
  FileInput,
  Upload,
  Home,
  RefreshCw,
  LineChart,
  List,
  Eye,
  Cloud,
  AlertCircle,
  MapPin
} from 'lucide-react';

// --- Firebase Configuration & Initialization ---
// ⚠️ 注意：这就是教程里提到的部分 (Line 46 - 68)
let firebaseConfig;
let appId = 'ming-jii-default';

try {
  // 1. 尝试读取预览环境的配置 (Preview Mode)
  // 如果你在 Vercel/StackBlitz，这步会报错，然后跳到 catch 块
  firebaseConfig = JSON.parse(__firebase_config);
  if(typeof __app_id !== 'undefined') appId = __app_id;
} catch (e) {
  // 2. --- ⚠️ 这里填入你自己的 FIREBASE 配置 (部署模式) ---
  // 请将下面的 YOUR_API_KEY 等替换成你在 Firebase 控制台复制的内容
  firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

// --- Initial Data Seed (Complete 1-62 List) ---
const DEFAULT_PRODUCTS = [
  { id: 'p1', code: '1', name: 'A1', price: 2.20 },
  { id: 'p2', code: '2', name: 'A2', price: 4.45 },
  { id: 'p3', code: '3', name: 'CSP0.5', price: 1.70 },
  { id: 'p4', code: '4', name: 'CSP1.0', price: 3.40 },
  { id: 'p5', code: '5', name: 'U0.5', price: 2.20 },
  { id: 'p6', code: '6', name: 'U1.0', price: 4.35 },
  { id: 'p7', code: '7', name: 'ZP1', price: 1.45 },
  { id: 'p8', code: '8', name: 'ZP2', price: 2.85 },
  { id: 'p9', code: '9', name: 'KA', price: 1.40 },
  { id: 'p10', code: '10', name: '黑酱', price: 11.20 },
  { id: 'p11', code: '11', name: '红酱', price: 12.10 },
  { id: 'p12', code: '12', name: '斑斓汁', price: 3.85 },
  { id: 'p13', code: '13', name: '叉烧酱', price: 4.55 },
  { id: 'p14', code: '14', name: '安顺料', price: 41.10 },
  { id: 'p15', code: '15', name: '辣椒酱', price: 25.20 },
  { id: 'p16', code: '16', name: '鸡肉卷(盒)', price: 76.50 },
  { id: 'p17', code: '17', name: '猪肉卷(盒)', price: 11.00 }, 
  { id: 'p18', code: '18', name: '西蛤肉', price: 25.00 },
  { id: 'p19', code: '19', name: '虾肉', price: 25.00 },
  { id: 'p20', code: '20', name: '鸡脚肉', price: 40.00 },
  { id: 'p21', code: '21', name: '叉烧肉（2KG)', price: 88.00 },
  { id: 'p22', code: '22', name: '猪皮肉', price: 45.00 },
  { id: 'p23', code: '23', name: 'Sambal', price: 21.50 },
  { id: 'p24', code: '24', name: '云吞皮（条）', price: 31.35 },
  { id: 'p25', code: '25', name: '水饺皮(条)', price: 31.35 },
  { id: 'p26', code: '26', name: '酱青', price: 22.80 },
  { id: 'p27', code: '27', name: '厨房纸', price: 11.80 },
  { id: 'p28', code: '28', name: 'AJINOMOTO (1KG)', price: 14.00 },
  { id: 'p29', code: '29', name: '文东酱青', price: 26.40 },
  { id: 'p30', code: '30', name: '蚝油', price: 16.00 },
  { id: 'p31', code: '31', name: '酿茄子', price: 1.20 },
  { id: 'p32', code: '32', name: '酿苦瓜', price: 1.20 },
  { id: 'p33', code: '33', name: '酿羊角豆', price: 1.20 },
  { id: 'p34', code: '34', name: '酿青辣椒', price: 1.20 },
  { id: 'p35', code: '35', name: '酿红辣椒', price: 1.20 },
  { id: 'p36', code: '36', name: '酿腐竹', price: 1.20 },
  { id: 'p37', code: '37', name: '酿豆腐', price: 1.00 },
  { id: 'p38', code: '38', name: '豆卜', price: 1.00 },
  { id: 'p39', code: '39', name: '酿油条', price: 1.00 },
  { id: 'p40', code: '40', name: '酿菜豆', price: 1.00 },
  { id: 'p41', code: '41', name: '菜丸（20）', price: 12.00 },
  { id: 'p42', code: '42', name: 'otak 条', price: 0.70 },
  { id: 'p43', code: '43', name: '鱼饼(20)', price: 16.00 },
  { id: 'p44', code: '44', name: '金宝炸圆', price: 8.70 },
  { id: 'p45', code: '45', name: '白鱼肉(250g)', price: 3.00 },
  { id: 'p46', code: '46', name: '猪肠粉', price: 29.50 },
  { id: 'p47', code: '47', name: '米浆', price: 31.70 },
  { id: 'p48', code: '48', name: '水饺肉 （1KG)', price: 35.50 },
  { id: 'p49', code: '49', name: '云吞肉 (1KG)', price: 14.50 },
  { id: 'p50', code: '50', name: 'KARI', price: 17.35 },
  { id: 'p51', code: '51', name: '腌青辣椒', price: 25.00 },
  { id: 'p52', code: '52', name: '咖喱油', price: 15.00 },
  { id: 'p53', code: '53', name: '鱼丸', price: 12.85 },
  { id: 'p54', code: '54', name: '凉粉', price: 10.50 },
  { id: 'p55', code: '55', name: '卜卜脆', price: 50.00 },
  { id: 'p56', code: '56', name: '长豆', price: 0.00 }, 
  { id: 'p57', code: '57', name: '芋头糕', price: 42.35 },
  { id: 'p58', code: '58', name: '虾米辣椒', price: 6.50 },
  { id: 'p59', code: '59', name: '蒜米', price: 9.40 },
  { id: 'p60', code: '60', name: '盐', price: 0.50 },
  { id: 'p61', code: '61', name: '炸腐竹', price: 3.00 },
  { id: 'p62', code: '62', name: '芝麻 (0.5KG)', price: 11.00 },
];

const INITIAL_BRANCHES = [
  { id: 'b1', name: 'TUTA (总店)', address: '176, JALAN PAHLAWAN 2, TAMAN UNGKU TUN AMINAH, 81300 SKUDAI, JOHOR' },
  { id: 'b2', name: 'JOHOR JAYA', address: '19, JALAN DEDAP 19, TAMAN JOHOR JAYA, 81100, JOHOR BAHRU, JOHOR' }
];

// --- Independent Components ---

const InvoicePreviewModal = ({ items, total, date, invNo, branchName, branchAddress, onClose }) => {
    const ITEMS_PER_PAGE = 40; 
    const pages = [];
    for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
        pages.push(items.slice(i, i + ITEMS_PER_PAGE));
    }
    if(pages.length === 0) pages.push([]); 

    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
      <div className="fixed inset-0 bg-slate-900/90 z-[90] overflow-auto py-10 flex flex-col items-center">
        <div className="fixed top-4 right-4 flex gap-2 print:hidden z-[100]">
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 shadow-lg font-bold"><Printer size={18}/> Print Again</button>
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 font-bold">Close</button>
        </div>

        {pages.map((pageItems, pageIndex) => {
            const isLastPage = pageIndex === pages.length - 1;
            const mid = Math.ceil(pageItems.length / 2);
            const col1 = pageItems.slice(0, mid);
            const col2 = pageItems.slice(mid);

            return (
                <div key={pageIndex} className="bg-white w-[210mm] min-h-[297mm] p-8 shadow-2xl mb-8 relative print:mb-0 print:shadow-none print:break-after-page flex flex-col">
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold tracking-wide">MING JII RESTAURANT SDN BHD</h1>
                        <p className="text-xs">(Company No. 1323914-H)</p>
                        <p className="text-sm mt-1">NO. 164 JALAN PAHLAWAN 2, TAMAN UNGKU TUN AMINAH 81300 SKUDAI JOHOR</p>
                        <p className="text-sm">Tel: 012-777 1943</p>
                        <h2 className="text-xl font-bold border-b-2 border-black inline-block mt-2 mb-2">CASH SALES</h2>
                    </div>

                    <div className="flex justify-between mb-4 text-sm font-mono border-b pb-4">
                        <div className="w-1/2">
                        <p><strong>To:</strong> {branchName}</p>
                        <p className="whitespace-pre-wrap">{branchAddress}</p>
                        </div>
                        <div className="w-1/3 text-right">
                        <p><strong>Date:</strong> {formatDate(date)}</p>
                        <p><strong>Inv No:</strong> {invNo}</p>
                        <p className="text-xs text-slate-500 mt-1">Page {pageIndex + 1} of {pages.length}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start flex-grow">
                        {[col1, col2].map((col, colIdx) => (
                        <table className="w-1/2 text-sm border-collapse h-fit" key={colIdx}>
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="text-left py-1 w-8">No.</th>
                                    <th className="text-left py-1">Description</th>
                                    <th className="text-center py-1 w-12">Qty</th>
                                    <th className="text-right py-1 w-16">Price</th>
                                    <th className="text-right py-1 w-20">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                            {col.map((item, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                <td className="py-1">{item.originalIndex + 1}</td>
                                <td className="py-1">{item.name}</td>
                                <td className="py-1 text-center font-bold">{item.qty}</td>
                                <td className="py-1 text-right">{item.price.toFixed(2)}</td>
                                <td className="py-1 text-right">{item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        ))}
                    </div>

                    {isLastPage ? (
                        <div className="mt-auto pt-4">
                             <div className="flex justify-end">
                                <div className="w-64 border-t-2 border-black pt-2">
                                    <div className="flex justify-between text-xl font-bold"><span>TOTAL:</span><span>{formatCurrency(total)}</span></div>
                                </div>
                             </div>
                             <div className="mt-12 flex justify-between text-sm">
                                <div className="text-center"><div className="w-48 border-b border-black mb-2"></div><p>Received By</p></div>
                                <div className="text-center"><div className="w-48 border-b border-black mb-2"></div><p>Signature</p></div>
                             </div>
                        </div>
                    ) : (
                        <div className="absolute bottom-8 left-0 right-0 text-center text-sm italic text-slate-400">
                            Continued on next page...
                        </div>
                    )}
                </div>
            )
        })}
      </div>
    );
};

const PriceHistoryChart = ({ history, currentPrice }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-lg border border-slate-100 p-4">
        <LineChart className="text-slate-300 mb-2" size={32} />
        <p className="text-sm text-slate-400">暂无价格变动记录</p>
        <p className="text-xs text-slate-400">No price history yet</p>
      </div>
    );
  }

  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const dataPoints = sortedHistory.map(h => ({
    date: new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
    price: h.newPrice
  }));
  
  dataPoints.push({
    date: 'Now',
    price: currentPrice
  });

  const prices = dataPoints.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.9;
  const maxPrice = Math.max(...prices) * 1.1;
  const range = maxPrice - minPrice || 1;

  const width = 300;
  const height = 150;
  const padding = 20;

  const points = dataPoints.map((point, index) => {
    const x = padding + (index / (dataPoints.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((point.price - minPrice) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
      <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-blue-500"/> 价格走势 (Price Trend)
      </h4>
      <div className="relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#eee" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#eee" strokeWidth="1" />
          <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
          {dataPoints.map((point, index) => {
            const x = padding + (index / (dataPoints.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((point.price - minPrice) / range) * (height - 2 * padding);
            return (
              <g key={index}>
                <circle cx={x} cy={y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">{point.price.toFixed(2)}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// --- Components ---

const Sidebar = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'newOrder', label: '主页 / 开单 (Home)', icon: Home },
    { id: 'products', label: '货价 Price List', icon: Package },
    { id: 'reports', label: '报表 Reports', icon: TrendingUp },
    { id: 'settings', label: '设定 Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-20 hidden md:flex">
      <div className="p-6 border-b border-slate-700 bg-slate-800">
        <h1 className="text-xl font-bold text-yellow-400 tracking-wider">MING JII</h1>
        <p className="text-xs text-slate-400 mt-1">云端进销存系统 v4.5</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id ? 'bg-yellow-500 text-slate-900 font-bold shadow-md transform scale-105' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

const ProductManager = ({ products, onUpdateProduct, onInitData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '' });
  const [historyView, setHistoryView] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ code: '', name: '', price: '' });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.includes(searchTerm)
  );

  const startEditing = (product) => {
    setEditingId(product.id);
    setEditForm({ name: product.name, price: product.price });
  };

  const handleSave = async (product) => {
    const newPrice = parseFloat(editForm.price);
    const newName = editForm.name;
    
    if (newPrice === product.price && newName === product.name) {
      setEditingId(null);
      return;
    }

    const historyEntry = {
      oldPrice: product.price,
      newPrice: newPrice,
      oldName: product.name,
      newName: newName,
      date: new Date().toISOString(),
      updatedBy: 'Admin'
    };

    const updatedProduct = {
      ...product,
      name: newName,
      price: newPrice,
      history: [...(product.history || []), historyEntry]
    };

    await onUpdateProduct(updatedProduct);
    setEditingId(null);
  };

  const handleAddItem = async () => {
    if (!newItem.code || !newItem.name || !newItem.price) {
        alert("Please fill in all fields");
        return;
    }
    if (products.some(p => p.code === newItem.code)) {
        alert(`Code ${newItem.code} already exists!`);
        return;
    }
    const product = {
        id: `p${newItem.code}`,
        code: newItem.code,
        name: newItem.name,
        price: parseFloat(newItem.price),
        history: [],
        createdAt: new Date().toISOString()
    };
    await onUpdateProduct(product);
    setShowAddModal(false);
    setNewItem({ code: '', name: '', price: '' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Package /> 货物列表 (62 Items)
        </h2>
        <div className="flex flex-wrap gap-3">
            <button 
                onClick={onInitData} 
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 flex items-center gap-2 shadow border border-red-200 text-sm font-medium"
                title="Reset to default 62 items"
            >
                <RefreshCw size={16} /> 重置为默认数据 (Reset Data)
            </button>
            <button 
                onClick={() => {
                    const nextCode = products.length > 0 ? Math.max(...products.map(p => parseInt(p.code) || 0)) + 1 : 1;
                    setNewItem({ code: nextCode.toString(), name: '', price: '' });
                    setShowAddModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow font-bold"
            >
                <Plus size={18} /> 添加货物 (Add Item)
            </button>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="pl-9 pr-4 py-2 border rounded-lg w-40 focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-slate-600 w-16">No.</th>
              <th className="p-4 font-semibold text-slate-600">Name 名称</th>
              <th className="p-4 font-semibold text-slate-600 w-32">Price 价格</th>
              <th className="p-4 font-semibold text-slate-600 text-right w-32">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map(product => (
              <tr key={product.id} className={`hover:bg-slate-50 transition ${product.price === 0 ? 'bg-orange-50' : ''}`}>
                <td className="p-4 text-slate-500 font-mono font-bold">{product.code}</td>
                <td className="p-4 font-medium">
                  {editingId === product.id ? (
                    <input 
                      type="text"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-400"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      autoFocus
                    />
                  ) : <span className="text-slate-700">{product.name}</span>}
                </td>
                <td className="p-4">
                  {editingId === product.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-xs">RM</span>
                      <input 
                        type="number" step="0.01" className="w-20 p-2 border rounded focus:ring-2 focus:ring-yellow-400"
                        value={editForm.price}
                        onChange={e => setEditForm({...editForm, price: e.target.value})}
                      />
                    </div>
                  ) : <span className="font-bold text-slate-700">{formatCurrency(product.price)}</span>}
                </td>
                <td className="p-4 text-right space-x-2 flex justify-end items-center">
                  {editingId === product.id ? (
                    <button onClick={() => handleSave(product)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"><Save size={14}/> Save</button>
                  ) : (
                    <button onClick={() => startEditing(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 size={16}/></button>
                  )}
                  <button onClick={() => setHistoryView(historyView === product.id ? null : product.id)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full"><History size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h3 className="text-xl font-bold">Add New Item</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                </div>
                <div className="space-y-4">
                    <input type="number" className="w-full p-2 border rounded" value={newItem.code} onChange={e => setNewItem({...newItem, code: e.target.value})} placeholder="Code"/>
                    <input type="text" className="w-full p-2 border rounded" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Name"/>
                    <input type="number" className="w-full p-2 border rounded" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="Price"/>
                    <button onClick={handleAddItem} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">Save</button>
                </div>
            </div>
        </div>
      )}

      {historyView && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full md:w-[450px] bg-white h-full shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Price History</h3>
              <button onClick={() => setHistoryView(null)} className="text-2xl">&times;</button>
            </div>
            <PriceHistoryChart history={products.find(p => p.id === historyView)?.history} currentPrice={products.find(p => p.id === historyView)?.price} />
          </div>
        </div>
      )}
    </div>
  );
};

// 3. New Invoice / Order Form
const OrderForm = ({ products, branches, onSaveOrder, orders }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantities, setQuantities] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved');
  const [isSaving, setIsSaving] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const [alertMsg, setAlertMsg] = useState(null); 
  
  // State for Preview Modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  const lastLoadedContext = useRef({ date: null, branchId: null });
  const currentBranch = branches.find(b => b.id === selectedBranch);
  
  const [existingOrderData, setExistingOrderData] = useState(null);

  useEffect(() => {
    if (lastLoadedContext.current.date !== date || lastLoadedContext.current.branchId !== selectedBranch) {
        const existingOrder = orders.find(o => o.date === date && o.branchId === selectedBranch);
        if (existingOrder) {
            const qtyMap = {};
            existingOrder.items.forEach(item => {
                qtyMap[item.id] = item.qty;
            });
            setQuantities(qtyMap);
            setExistingOrderData(existingOrder);
        } else {
            setQuantities({});
            setExistingOrderData(null);
        }
        lastLoadedContext.current = { date, branchId: selectedBranch };
    }
  }, [date, selectedBranch, orders]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (Object.keys(quantities).length === 0 && saveStatus === 'saved') return; 

        setSaveStatus('saving...');
        
        let total = 0;
        const items = [];
        Object.entries(quantities).forEach(([pid, qty]) => {
            const product = products.find(p => p.id === pid);
            const q = parseFloat(qty);
            if (product && !isNaN(q) && q > 0) {
                total += product.price * q;
                items.push({ ...product, qty: q, amount: product.price * q });
            }
        });

        const creationTime = existingOrderData ? existingOrderData.createdAt : new Date().toISOString();

        const orderData = {
            date,
            branchId: selectedBranch,
            branchName: currentBranch.name,
            items,
            totalAmount: total,
            createdAt: creationTime,
            status: 'completed',
            year: parseInt(date.split('-')[0]),
            month: parseInt(date.split('-')[1])
        };

        onSaveOrder(orderData);
        setTimeout(() => setSaveStatus('saved'), 500);

    }, 1000); 

    return () => clearTimeout(timer);
  }, [quantities, date, selectedBranch, existingOrderData]);

  const handleQtyChange = (productId, qty) => {
    const val = parseFloat(qty);
    const product = products.find(p => p.id === productId);
    
    if (val > 100) {
        setAlertMsg(`⚠️ 注意：${product?.name} 数量超过 100 (Qty: ${val})！`);
        setTimeout(() => setAlertMsg(null), 4000);
    }

    setQuantities(prev => ({ ...prev, [productId]: qty }));
    setSaveStatus('unsaved');
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
    }
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      const nextInput = document.getElementById(`qty-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select(); 
      }
    } else if (e.key === 'ArrowUp') {
      const prevInput = document.getElementById(`qty-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(quantities).forEach(([pid, qty]) => {
      const product = products.find(p => p.id === pid);
      const q = parseFloat(qty);
      if (product && !isNaN(q) && q > 0) {
        total += product.price * q;
      }
    });
    return total;
  };

  const getLineItems = () => {
    return Object.entries(quantities)
      .map(([pid, qty]) => {
        const product = products.find(p => p.id === pid);
        const q = parseFloat(qty);
        if (!product || isNaN(q) || q <= 0) return null;
        return {
          ...product,
          qty: q,
          amount: product.price * q
        };
      })
      .filter(Boolean)
      .map((item, index) => ({...item, originalIndex: index}));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.includes(searchTerm)
  );

  const handleSaveAndPrint = async () => {
    const items = getLineItems();
    if (items.length === 0) {
      alert("请至少输入一个数量 (Please enter at least one quantity)");
      return;
    }

    setIsSaving(true);
    let total = 0;
    items.forEach(item => total += item.amount);
    const creationTime = existingOrderData ? existingOrderData.createdAt : new Date().toISOString();

    const orderData = {
      date,
      branchId: selectedBranch,
      branchName: currentBranch.name,
      items,
      totalAmount: total,
      createdAt: creationTime,
      status: 'completed',
      year: parseInt(date.split('-')[0]),
      month: parseInt(date.split('-')[1])
    };

    await onSaveOrder(orderData);
    setIsSaving(false);
    
    // Set data for preview and open modal
    setPreviewData({
        items,
        total,
        date,
        invNo: new Date(creationTime).getTime().toString().slice(-6),
        branchName: currentBranch.name,
        branchAddress: currentBranch.address
    });
    setShowPreview(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24">
      {/* Preview Modal */}
      {showPreview && previewData && (
        <InvoicePreviewModal 
            {...previewData} 
            onClose={() => setShowPreview(false)} 
        />
      )}

      {/* Alert */}
      {alertMsg && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in">
            <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-lg">
                <AlertCircle /> {alertMsg}
            </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
          <div className="flex gap-3 w-full md:w-auto items-center">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
              <Calendar className="text-slate-500" size={18} />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent outline-none font-medium text-slate-700"/>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg flex-1 border border-slate-200">
              <Store className="text-slate-500" size={18} />
              <select className="bg-transparent outline-none font-medium w-full text-slate-700" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
             <div className="text-right">
                <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Status</span>
                <span className={`text-sm font-bold flex items-center gap-1 ${saveStatus === 'saved' ? 'text-green-600' : 'text-orange-500'}`}>
                    {saveStatus === 'saved' ? <><CheckCircle size={14}/> Saved</> : <><Loader size={14} className="animate-spin"/> Saving...</>}
                </span>
             </div>
             <div className="text-xl font-bold text-slate-800 whitespace-nowrap">
                Total: <span className="text-yellow-600">{formatCurrency(calculateTotal())}</span>
             </div>
          </div>
        </div>
        
        <div className="relative w-full mb-4">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
                    type="text" 
                    placeholder="Search item..." 
                    className="pl-9 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-yellow-500 outline-none text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
        </div>

        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-100 rounded-lg text-sm font-semibold text-slate-600">
            <div className="col-span-1">No.</div>
            <div className="col-span-6">Description / 货物</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-3 text-center">Qty / 数量</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredProducts.map((product, idx) => (
          <div key={product.id} className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border-b transition-colors ${quantities[product.id] > 0 ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
            <div className="col-span-1 font-mono text-slate-400 text-sm">{product.code}</div>
            <div className="col-span-6 font-medium text-slate-800 truncate">{product.name}</div>
            <div className="col-span-2 text-right text-slate-600 text-sm">{product.price > 0 ? product.price.toFixed(2) : '-'}</div>
            <div className="col-span-3 flex justify-center">
              <input 
                id={`qty-input-${idx}`} // Added ID for navigation
                type="number" min="0" step="0.5" placeholder="-" 
                className={`w-24 p-2 border rounded text-center outline-none focus:ring-2 font-bold ${
                    quantities[product.id] > 100 
                        ? 'border-red-500 bg-red-50 text-red-600 focus:ring-red-500 animate-pulse' 
                        : quantities[product.id] > 0 
                            ? 'border-yellow-400 bg-white text-slate-900 focus:ring-yellow-400 shadow-sm' 
                            : 'bg-slate-50 text-slate-400 border-gray-200'
                }`}
                value={quantities[product.id] || ''}
                onChange={(e) => handleQtyChange(product.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onWheel={(e) => e.target.blur()} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 right-6 md:right-10 flex gap-4">
        <button onClick={() => { if(confirm("Clear all?")) setQuantities({}); }} className="bg-white text-slate-600 shadow-lg px-6 py-4 rounded-full font-bold hover:bg-slate-50 border hidden md:block">Reset 清空</button>
        <button 
          onClick={handleSaveAndPrint}
          disabled={isSaving}
          className="bg-yellow-500 text-slate-900 shadow-xl px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-yellow-400 transform hover:scale-105 transition"
        >
          <Printer /> Print (Direct)
        </button>
      </div>
    </div>
  );
};

// 4. Reports Component
const Reports = ({ orders, branches }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); 
  const [filterBranch, setFilterBranch] = useState('all');
  const [reportType, setReportType] = useState('monthly'); 
  const [viewMode, setViewMode] = useState('stats');
  
  // State for Reprint Modal
  const [reprintOrder, setReprintOrder] = useState(null);
  const [showReprintModal, setShowReprintModal] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const date = new Date(order.date);
      return date.getFullYear() === year && 
             (reportType === 'monthly' ? date.getMonth() + 1 === month : true) &&
             (filterBranch === 'all' ? true : order.branchId === filterBranch);
    });
  }, [orders, year, month, filterBranch, reportType]);

  const stats = useMemo(() => {
    let totalSales = 0;
    let productSales = {};
    let branchBreakdown = {};

    branches.forEach(b => {
        branchBreakdown[b.id] = { name: b.name, amount: 0, count: 0 };
    });

    filteredOrders.forEach(order => {
      totalSales += order.totalAmount;
      
      if(branchBreakdown[order.branchId]) {
          branchBreakdown[order.branchId].amount += order.totalAmount;
          branchBreakdown[order.branchId].count += 1;
      }

      order.items.forEach(item => {
        if (!productSales[item.id]) productSales[item.id] = { name: item.name, qty: 0, amount: 0 };
        productSales[item.id].qty += item.qty;
        productSales[item.id].amount += item.amount;
      });
    });
    return { totalSales, productSales, branchBreakdown };
  }, [filteredOrders, branches]);

  const handleReprint = (order) => {
      setReprintOrder({
          items: order.items,
          total: order.totalAmount,
          date: order.date,
          invNo: new Date(order.createdAt).getTime().toString().slice(-6),
          branchName: order.branchName,
          branchAddress: branches.find(b => b.id === order.branchId)?.address
      });
      setShowReprintModal(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {showReprintModal && reprintOrder && (
          <InvoicePreviewModal 
            {...reprintOrder} 
            onClose={() => setShowReprintModal(false)} 
          />
      )}

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><TrendingUp /> 销售报表 Reports</h2>
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-wrap gap-4 items-end">
         <div>
           <label className="block text-xs text-slate-500 mb-1">View Mode</label>
           <div className="flex bg-slate-100 rounded p-1"><button onClick={() => setViewMode('stats')} className={`px-3 py-1 rounded ${viewMode==='stats'?'bg-white shadow':''}`}>Stats</button><button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded ${viewMode==='list'?'bg-white shadow':''}`}>List</button></div>
         </div>
         <div><label className="block text-xs text-slate-500">Year</label><select value={year} onChange={e=>setYear(parseInt(e.target.value))} className="p-2 border rounded">{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select></div>
         <div><label className="block text-xs text-slate-500">Month</label><select value={month} onChange={e=>setMonth(parseInt(e.target.value))} className="p-2 border rounded">{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}月</option>)}</select></div>
         <div><label className="block text-xs text-slate-500">Branch</label><select value={filterBranch} onChange={e=>setFilterBranch(e.target.value)} className="p-2 border rounded w-40"><option value="all">All Branches</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
      </div>
      
      {viewMode === 'stats' ? (
          <div className="grid grid-cols-1 gap-6">
             <div className="bg-blue-600 text-white p-6 rounded-xl shadow">
                <h3 className="opacity-90">Total Sales 总销量</h3>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalSales)}</p>
                <p className="text-sm opacity-75 mt-1">{filteredOrders.length} orders total</p>
             </div>
             {filterBranch === 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map(b => (
                        <div key={b.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-300"><MapPin size={48} /></div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{b.name}</p>
                                <p className="text-xl font-bold text-slate-800">{formatCurrency(stats.branchBreakdown[b.id]?.amount || 0)}</p>
                            </div>
                            <div className="z-10">
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{stats.branchBreakdown[b.id]?.count || 0} orders</span>
                            </div>
                        </div>
                    ))}
                </div>
             )}
             <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b bg-slate-50 font-semibold text-slate-700">Item Breakdown 货物明细</div>
                <table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Item</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Amount</th></tr></thead><tbody>
                {Object.values(stats.productSales).sort((a,b)=>b.amount-a.amount).map((item,i)=><tr key={i} className="border-b hover:bg-slate-50"><td className="p-3">{item.name}</td><td className="p-3 text-right">{item.qty}</td><td className="p-3 text-right">{formatCurrency(item.amount)}</td></tr>)}
                {Object.keys(stats.productSales).length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-400">No data found.</td></tr>}
                </tbody></table>
             </div>
          </div>
      ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
             <table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Date</th><th className="p-3">Branch</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Action</th></tr></thead><tbody>
             {filteredOrders.sort((a,b)=>new Date(b.date)-new Date(a.date)).map((o,i)=><tr key={i} className="border-b hover:bg-slate-50"><td className="p-3">{formatDate(o.date)}</td><td className="p-3">{o.branchName}</td><td className="p-3 text-right font-bold">{formatCurrency(o.totalAmount)}</td><td className="p-3 text-center"><button onClick={()=>handleReprint(o)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Eye size={16}/></button></td></tr>)}
             </tbody></table>
          </div>
      )}
    </div>
  )
}

// 5. Settings (Add Branch + Storage Status)
const SettingsPage = ({ branches, onAddBranch, products, orders }) => {
   const [newBranch, setNewBranch] = useState({ name: '', address: '' });
   const calculateStorage = () => {
       const productsSize = new Blob([JSON.stringify(products)]).size;
       const ordersSize = new Blob([JSON.stringify(orders)]).size;
       const totalBytes = productsSize + ordersSize;
       const totalKB = (totalBytes / 1024).toFixed(2);
       const totalMB = (totalBytes / (1024 * 1024)).toFixed(4);
       const limitBytes = 1024 * 1024 * 1024; 
       const percentage = Math.min((totalBytes / limitBytes) * 100, 100).toFixed(6);
       return { totalKB, totalMB, percentage };
   };
   const usage = calculateStorage();
   const handleAdd = () => {
     if(newBranch.name && newBranch.address) {
       onAddBranch({ ...newBranch, id: `b${Date.now()}` });
       setNewBranch({ name: '', address: '' });
     }
   }

   return (
     <div className="p-6 max-w-4xl mx-auto">
       <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings /> 系统设定</h2>
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Cloud className="text-blue-500"/> 云端存储空间 (Cloud Storage)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100"><p className="text-xs text-slate-400 uppercase tracking-wider font-bold">已用空间 Used</p><p className="text-2xl font-bold text-slate-700">{usage.totalKB} <span className="text-sm text-slate-500">KB</span></p></div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><p className="text-xs text-blue-400 uppercase tracking-wider font-bold">剩余空间 Remaining</p><p className="text-2xl font-bold text-blue-700">~1024 <span className="text-sm text-blue-500">MB</span></p></div>
                <div className="flex flex-col justify-center"><div className="flex justify-between text-xs mb-1 font-bold text-slate-600"><span>Usage</span><span>{usage.percentage}%</span></div><div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden"><div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.max(parseFloat(usage.percentage), 1)}%` }}></div></div></div>
            </div>
       </div>
       <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
         <h3 className="font-bold text-lg mb-4">Manage Branches 分店管理</h3>
         <div className="space-y-4">
           {branches.map(b => (
             <div key={b.id} className="p-4 border rounded bg-slate-50 flex justify-between items-center"><div><p className="font-bold">{b.name}</p><p className="text-xs text-slate-500 max-w-md">{b.address}</p></div><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span></div>
           ))}
         </div>
         <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Add New Branch</h4>
            <div className="grid gap-4">
              <input type="text" placeholder="Branch Name (e.g. Mount Austin)" className="p-2 border rounded" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})}/>
              <textarea placeholder="Address" className="p-2 border rounded" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})}/>
              <button onClick={handleAdd} className="bg-slate-800 text-white py-2 rounded hover:bg-slate-900">Add Branch</button>
            </div>
         </div>
       </div>
     </div>
   )
}

// --- Main App Container ---
const App = () => {
  const [user, setUser] = useState(null);
  const [currentView, setView] = useState('newOrder');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const prodUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'products'), async (snap) => {
      let list = snap.docs.map(d => d.data());
      if (list.length === 0) {
         try {
            await Promise.all(DEFAULT_PRODUCTS.map(p => setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'products', p.id), p)));
         } catch(e) {}
      } else {
         setProducts(list.sort((a,b) => parseInt(a.code) - parseInt(b.code)));
      }
    });
    const orderUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'orders'), (snap) => {
      setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const branchUnsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'branches'), async (snap) => {
      const list = snap.docs.map(d => d.data());
      if (list.length > 0) setBranches(list);
      else {
         await Promise.all(INITIAL_BRANCHES.map(b => setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'branches', b.id), b)));
         setBranches(INITIAL_BRANCHES);
      }
    });
    setLoading(false);
    return () => { prodUnsub(); orderUnsub(); branchUnsub(); };
  }, [user]);

  const updateProduct = async (product) => { if(user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'products', product.id), product); };
  
  const saveOrder = async (orderData) => {
    if(!user) return;
    const existing = orders.find(o => o.date === orderData.date && o.branchId === orderData.branchId);
    if (existing) {
       await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'orders', existing.id), { ...orderData, updatedAt: new Date().toISOString() });
    } else {
       await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'orders'), orderData);
    }
  };

  const addBranch = async (branchData) => { if(user) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'branches', branchData.id), branchData); };

  const onResetData = async () => {
      if(!user) return;
      if(confirm("确定要重置数据吗? This will reset all products to default.")){
        try {
            await Promise.all(DEFAULT_PRODUCTS.map(p => setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'products', p.id), p)));
            alert("重置成功!");
        } catch(e) { alert("Error resetting"); }
      }
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Loading System...</div>;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar currentView={currentView} setView={setView} />
      <main className="flex-1 md:ml-64 overflow-y-auto bg-slate-50">
        <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
          <button onClick={() => setView('newOrder')} className="font-bold text-yellow-400 text-lg">MING JII</button>
          <button onClick={() => setView('newOrder')}><FileText /></button>
        </div>
        {currentView === 'products' && <ProductManager products={products} onUpdateProduct={updateProduct} onInitData={onResetData} />}
        {currentView === 'newOrder' && <OrderForm products={products} branches={branches.length > 0 ? branches : INITIAL_BRANCHES} onSaveOrder={saveOrder} orders={orders} />}
        {currentView === 'reports' && <Reports orders={orders} branches={branches} />}
        {currentView === 'settings' && <SettingsPage branches={branches} onAddBranch={addBranch} products={products} orders={orders} />}
      </main>
    </div>
  );
};

export default App;