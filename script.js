import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// إعدادات فايربيس الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSyD5AhcV4dky3MdBizPdrCkNHMb9_NF9Yko",
    authDomain: "lkhf-5a292.firebaseapp.com",
    projectId: "lkhf-5a292",
    storageBucket: "lkhf-5a292.firebasestorage.app",
    messagingSenderId: "722146610247",
    appId: "1:722146610247:web:b8583a37f0776acd4d3562",
    measurementId: "G-LWZKCMLESD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const IMGBB_API_KEY = "872edef7066f0226f009e515daa0f951";

// متغيرات لتخزين البيانات محلياً للفلترة
let ordersList = [];

// ================== واجهة المستخدم والمودال ==================
window.switchTab = function(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId + '-tab').classList.add('active');
    btn.classList.add('active');
};

window.showForm = function(formId) {
    document.getElementById('modal-overlay').style.display = 'flex';
    document.querySelectorAll('.modal-card').forEach(f => f.style.display = 'none');
    document.getElementById(formId).style.display = 'flex';
};

window.closeForm = function() { 
    document.getElementById('modal-overlay').style.display = 'none'; 
};

// ================== رفع الصور ==================
async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        const data = await response.json();
        return data.data.url;
    } catch(e) {
        alert("فشل رفع الصورة، تأكد من الاتصال بالإنترنت.");
        return null;
    }
}

// ================== إدارة الأقسام (تُجلب لنموذج المنتجات أيضاً) ==================
onSnapshot(collection(db, 'categories'), (snap) => {
    let catContainer = document.getElementById('category-list');
    let select = document.getElementById('p-category');
    
    catContainer.innerHTML = '';
    select.innerHTML = '<option value="">اختر القسم</option>';
    
    snap.forEach(docSnap => {
        let c = { id: docSnap.id, ...docSnap.data() };
        // عرض القسم في لوحة الأقسام
        catContainer.innerHTML += `
            <div class="card grid-item">
                <img src="${c.image}">
                <h4>${c.name}</h4>
                <button class="btn-del" onclick="deleteCategory('${c.id}')"><i class="fas fa-trash"></i></button>
            </div>`;
        // إضافته للقائمة المنسدلة في إضافة المنتج
        select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
});

document.getElementById('category-form').onsubmit = async function(e) {
    e.preventDefault();
    let btn = this.querySelector('button[type="submit"]');
    btn.innerText = "جاري الرفع..."; btn.disabled = true;
    
    let imgUrl = await uploadImage(document.getElementById('c-img').files[0]);
    if(imgUrl) {
        await addDoc(collection(db, 'categories'), {
            name: document.getElementById('c-name').value,
            image: imgUrl
        });
        closeForm(); this.reset();
    }
    btn.innerText = "حفظ القسم"; btn.disabled = false;
};

window.deleteCategory = async function(id) {
    if(confirm("هل أنت متأكد من حذف القسم؟")) await deleteDoc(doc(db, 'categories', id));
};

// ================== إدارة المنتجات ==================
onSnapshot(collection(db, 'products'), (snap) => {
    let prodContainer = document.getElementById('product-list');
    prodContainer.innerHTML = '';
    snap.forEach(docSnap => {
        let p = { id: docSnap.id, ...docSnap.data() };
        prodContainer.innerHTML += `
            <div class="card">
                <img src="${p.image}">
                <div class="item-info"><h4>${p.name}</h4><p>${Number(p.price).toLocaleString()} د.ع - ${p.category}</p></div>
                <button class="btn-del" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>`;
    });
});

document.getElementById('product-form').onsubmit = async function(e) {
    e.preventDefault();
    let btn = this.querySelector('button[type="submit"]');
    btn.innerText = "جاري الرفع..."; btn.disabled = true;
    
    let imgUrl = await uploadImage(document.getElementById('p-img').files[0]);
    if(imgUrl) {
        await addDoc(collection(db, 'products'), {
            name: document.getElementById('p-name').value,
            category: document.getElementById('p-category').value,
            desc: document.getElementById('p-desc').value,
            price: Number(document.getElementById('p-price').value),
            image: imgUrl
        });
        closeForm(); this.reset();
    }
    btn.innerText = "حفظ المنتج"; btn.disabled = false;
};

window.deleteProduct = async function(id) {
    if(confirm("هل أنت متأكد من حذف المنتج؟")) await deleteDoc(doc(db, 'products', id));
};

// ================== إدارة البنرات ==================
onSnapshot(collection(db, 'banners'), (snap) => {
    let banContainer = document.getElementById('banner-list');
    banContainer.innerHTML = '';
    snap.forEach(docSnap => {
        let b = { id: docSnap.id, ...docSnap.data() };
        banContainer.innerHTML += `
            <div class="card banner-item">
                <img src="${b.image}">
                <button class="btn-del" onclick="deleteBanner('${b.id}')"><i class="fas fa-trash"></i> إزالة</button>
            </div>`;
    });
});

document.getElementById('banner-form').onsubmit = async function(e) {
    e.preventDefault();
    let btn = this.querySelector('button[type="submit"]');
    btn.innerText = "جاري الرفع..."; btn.disabled = true;
    
    let imgUrl = await uploadImage(document.getElementById('b-img').files[0]);
    if(imgUrl) {
        await addDoc(collection(db, 'banners'), { image: imgUrl });
        closeForm(); this.reset();
    }
    btn.innerText = "رفع الإعلان"; btn.disabled = false;
};

window.deleteBanner = async function(id) {
    if(confirm("هل أنت متأكد من إزالة البنر؟")) await deleteDoc(doc(db, 'banners', id));
};

// ================== إدارة الطلبات ==================
onSnapshot(collection(db, 'orders'), (snap) => {
    ordersList = [];
    snap.forEach(docSnap => {
        ordersList.push({ id: docSnap.id, ...docSnap.data() });
    });
    // تحديث العرض بناءً على التبويب النشط
    let activeStatus = document.getElementById('btn-pending').classList.contains('active') ? 'pending' : 'completed';
    filterOrders(activeStatus);
});

window.filterOrders = function(status) {
    document.querySelectorAll('.order-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(status === 'pending' ? 'btn-pending' : 'btn-completed').classList.add('active');
    
    let container = document.getElementById('orders-list');
    container.innerHTML = '';
    
    let filtered = ordersList.filter(o => o.status === status);
    filtered.forEach(o => {
        let itemsHtml = o.items.map(i => `${i.qty}x ${i.name}`).join(' ، ');
        container.innerHTML += `
            <div class="card" style="flex-direction:column; align-items:start;">
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <h4>${o.name} <a href="https://wa.me/${o.phone}" target="_blank" style="color:#10b981;"><i class="fab fa-whatsapp"></i> ${o.phone}</a></h4>
                    <strong style="color:var(--primary);">${Number(o.total).toLocaleString()} د.ع</strong>
                </div>
                <p><strong>العنوان:</strong> ${o.address}</p>
                <p><strong>الطلب:</strong> ${itemsHtml}</p>
                ${status === 'pending' ? `<button class="btn-approve mt-15" onclick="completeOrder('${o.id}')"><i class="fas fa-check"></i> نقل للمنتهية</button>` : ''}
                <button class="btn-del mt-15" onclick="deleteOrder('${o.id}')"><i class="fas fa-trash"></i> حذف</button>
            </div>
        `;
    });
};

window.completeOrder = async function(id) {
    await updateDoc(doc(db, 'orders', id), { status: 'completed' });
};
window.deleteOrder = async function(id) {
    if(confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) await deleteDoc(doc(db, 'orders', id));
};

// ================== سعر التوصيل ==================
onSnapshot(doc(db, 'settings', 'delivery'), (docSnap) => {
    if(docSnap.exists()) {
        document.getElementById('delivery-price-input').value = docSnap.data().price || 0;
    }
});

window.saveDeliveryPrice = async function() {
    let val = document.getElementById('delivery-price-input').value;
    await setDoc(doc(db, 'settings', 'delivery'), { price: Number(val) });
    alert('تم حفظ سعر التوصيل بنجاح.');
};
