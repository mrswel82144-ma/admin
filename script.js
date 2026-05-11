import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ==========================================
// ⚙️ إعدادات المشروع بالكامل (CONFIG)
// ==========================================
const CONFIG = {
    IMGBB_API_KEY: "", // 🔴 ضع مفتاح ImgBB الخاص بك هنا بين علامتي التنصيص
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyD5AhcV4dky3MdBizPdrCkNHMb9_NF9Yko",
        authDomain: "lkhf-5a292.firebaseapp.com",
        projectId: "lkhf-5a292",
        storageBucket: "lkhf-5a292.firebasestorage.app",
        messagingSenderId: "722146610247",
        appId: "1:722146610247:web:b8583a37f0776acd4d3562",
        measurementId: "G-LWZKCMLESD"
    },
    COLLECTION_NAME: "products",
    ORDERS_COLLECTION: "orders"
};

const app = initializeApp(CONFIG.FIREBASE_CONFIG);
const db = getFirestore(app);

// التنقل بين التبويبات
window.switchTab = function(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById(tabId + '-tab').classList.add('active');
    element.classList.add('active');
};

// ==========================================
// 🖼️ نظام ضغط ومعاينة الصورة (Canvas)
// ==========================================
document.getElementById('p-image').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        previewContainer.style.display = 'none';
    }
});

// دالة الضغط (تقليل الحجم إلى أقصى عرض 800px، وجودة 0.7)
const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // استخراج الصورة المضغوطة 
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("فشل ضغط الصورة."));
                }, 'image/jpeg', 0.7); 
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

// ==========================================
// ☁️ الرفع لـ ImgBB والحفظ في Firebase
// ==========================================
function setStatus(msg, type = 'info') {
    const div = document.getElementById('upload-status');
    div.style.display = 'block';
    div.innerHTML = msg;
    if(type === 'info') { div.style.background = '#fffbeb'; div.style.color = '#d97706'; }
    if(type === 'success') { div.style.background = '#ecfdf5'; div.style.color = '#059669'; }
    if(type === 'error') { div.style.background = '#fef2f2'; div.style.color = '#dc2626'; }
}

document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!CONFIG.IMGBB_API_KEY) return alert("الرجاء وضع مفتاح ImgBB API في ملف script.js للإدارة أولاً!");

    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const imageFile = document.getElementById('p-image').files[0];
    const submitBtn = document.getElementById('submit-btn');

    try {
        submitBtn.disabled = true;
        
        // 1. ضغط الصورة
        setStatus('<i class="fas fa-spinner fa-spin"></i> جاري ضغط الصورة...', 'info');
        const compressedBlob = await compressImage(imageFile);
        
        // 2. الرفع إلى ImgBB
        setStatus('<i class="fas fa-spinner fa-spin"></i> جاري الرفع إلى ImgBB...', 'info');
        const formData = new FormData();
        formData.append('image', compressedBlob, 'product.jpg'); // يجب تحديد اسم هنا
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.IMGBB_API_KEY}`, {
            method: 'POST', body: formData
        });
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error.message);
        
        const imageUrl = data.data.url;
        const deleteUrl = data.data.delete_url;

        // 3. الحفظ في Firestore (روابط فقط بدون Base64)
        setStatus('<i class="fas fa-spinner fa-spin"></i> جاري الحفظ في قاعدة البيانات...', 'info');
        await addDoc(collection(db, CONFIG.COLLECTION_NAME), {
            name: name,
            price: Number(price),
            imageUrl: imageUrl,
            deleteUrl: deleteUrl,
            createdAt: serverTimestamp()
        });

        setStatus('<i class="fas fa-check-circle"></i> تم إضافة المنتج بنجاح!', 'success');
        this.reset();
        document.getElementById('preview-container').style.display = 'none';

    } catch (error) {
        setStatus(`<i class="fas fa-exclamation-triangle"></i> حدث خطأ: ${error.message}`, 'error');
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        setTimeout(() => { document.getElementById('upload-status').style.display = 'none'; }, 5000);
    }
});

// ==========================================
// 📋 جلب المنتجات والطلبات والحذف المزدوج
// ==========================================
function loadProducts() {
    const q = query(collection(db, CONFIG.COLLECTION_NAME), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('products-list');
        tbody.innerHTML = '';
        if(snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا توجد منتجات حالياً</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const p = docSnap.data();
            const date = p.createdAt ? p.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن';
            tbody.innerHTML += `
                <tr>
                    <td><img src="${p.imageUrl}" class="prod-img-tbl"></td>
                    <td style="font-weight:bold;">${p.name}</td>
                    <td style="color:var(--primary); font-weight:800;">${p.price}$</td>
                    <td>${date}</td>
                    <td><button class="btn-danger" id="del-btn-${docSnap.id}" onclick="window.deleteProduct('${docSnap.id}', '${p.deleteUrl || ''}')"><i class="fas fa-trash"></i> حذف</button></td>
                </tr>
            `;
        });
    });
}

// دالة الحذف المزدوج (ImgBB ثم Firestore)
window.deleteProduct = async function(id, deleteUrl) {
    if(!confirm("هل أنت متأكد من الحذف النهائي للمنتج من المتجر والسيرفر؟")) return;
    const btn = document.getElementById(`del-btn-${id}`);
    
    try {
        btn.innerHTML = "جاري...";
        btn.disabled = true;

        // 1. محاولة حذف الصورة من ImgBB
        if(deleteUrl) {
            try {
                // استخدام no-cors لتجنب إيقاف الكود بسبب قيود السيرفر الخارجي (CORS)
                await fetch(deleteUrl, { mode: 'no-cors' });
            } catch(e) {
                console.warn("تنبيه: تم تجاوز سياسات المتصفح أثناء طلب الحذف.", e);
            }
        }

        // 2. الحذف من قاعدة بيانات Firebase
        await deleteDoc(doc(db, CONFIG.COLLECTION_NAME, id));
        alert("تم الحذف بنجاح.");
    } catch (error) {
        alert("حدث خطأ أثناء الحذف!");
        console.error(error);
        btn.innerHTML = '<i class="fas fa-trash"></i> حذف';
        btn.disabled = false;
    }
};

function loadOrders() {
    const q = query(collection(db, CONFIG.ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('orders-list');
        tbody.innerHTML = '';
        if(snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">لا توجد طلبات واردة حتى الآن.</td></tr>';
            return;
        }

        snapshot.forEach((doc) => {
            const o = doc.data();
            const date = o.createdAt ? o.createdAt.toDate().toLocaleString('ar-EG') : 'الآن';
            const itemsList = o.items.map(i => `<span style="background:#f1f5f9; padding:4px 8px; border-radius:6px; margin:2px; display:inline-block;">${i.name}</span>`).join('');

            tbody.innerHTML += `
                <tr>
                    <td><span class="badge">${o.orderNumber}</span></td>
                    <td style="font-weight:bold;">${o.customerName}</td>
                    <td dir="ltr" style="text-align:right;">${o.customerPhone}</td>
                    <td>${o.customerAddress}</td>
                    <td style="font-size:13px; color:#64748b; max-width:250px;">${itemsList}</td>
                    <td style="font-weight:bold; color:#10b981; font-size:16px;">${o.totalPrice}$</td>
                    <td style="font-size:13px;">${date}</td>
                </tr>
            `;
        });
    });
}

// تشغيل جلب البيانات فوراً
window.onload = () => {
    loadProducts();
    loadOrders();
};
