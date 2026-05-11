// 1. التبديل بين القوائم الجانبية (Tabs)
function switchAdminTab(tabId, element) {
    // إخفاء كل اللوحات
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    // إزالة التفعيل من كل الروابط
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // تفعيل اللوحة والزر المحددين
    document.getElementById(tabId + '-tab').classList.add('active');
    element.classList.add('active');
    
    // إغلاق الشريط الجانبي في الجوال بعد الاختيار
    if(window.innerWidth <= 768) {
        toggleSidebar();
    }
}

// 2. التحكم بالشريط الجانبي في الهواتف
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// 3. النوافذ المنبثقة (Modals)
function openModal() {
    document.getElementById('product-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('product-modal').classList.remove('active');
}

// 4. بيانات وهمية لتجربة الجداول
const dummyProducts = [
    { id: 1, name: 'منسف لحم بلدي', price: 15.00, cat: 'مناسف لحم', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100' },
    { id: 2, name: 'منسف دجاج', price: 8.00, cat: 'مناسف دجاج', img: 'https://images.unsplash.com/photo-1547496502-affa22d38842?w=100' }
];

const dummyOrders = [
    { id: '#1001', customer: 'أحمد علي', total: '23.00 د.أ', details: '1x لحم, 1x دجاج', status: 'قيد الانتظار' },
    { id: '#1002', customer: 'سارة محمد', total: '15.00 د.أ', details: '1x لحم', status: 'جاري التوصيل' }
];

// عرض المنتجات في الجدول
function renderAdminProducts() {
    const tbody = document.getElementById('admin-products-list');
    dummyProducts.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${p.img}" alt="${p.name}"></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.price} د.أ</td>
                <td><span style="background:#f1f5f9; padding:5px 10px; border-radius:20px; font-size:12px;">${p.cat}</span></td>
                <td>
                    <button class="btn-action"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

// عرض الطلبات في الجدول
function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-list');
    const statuses = ['قيد الانتظار', 'قيد التحضير', 'جاري التوصيل', 'مكتمل'];
    
    dummyOrders.forEach(o => {
        // إنشاء قائمة منسدلة للحالة
        let options = statuses.map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('');
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${o.id}</strong></td>
                <td>${o.customer}</td>
                <td><strong>${o.total}</strong></td>
                <td>${o.details}</td>
                <td>
                    <select class="status-select">
                        ${options}
                    </select>
                </td>
            </tr>
        `;
    });
}

// تهيئة اللوحة
window.onload = () => {
    renderAdminProducts();
    renderAdminOrders();
};
