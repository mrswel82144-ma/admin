import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ==========================================
// ⚙️ إعدادات المشروع (مفتاح ImgBB الخاص بك مدمج)
// ==========================================
const CONFIG = {
    IMGBB_API_KEY: "872edef7066f0226f009e515daa0f951", // مفتاح الرفع الذي طلبته
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

window.switchTab = function(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById(tabId + '-tab').classList.add('active');
    element.classList.add('active');
};

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

function setStatus(msg, type = 'info') {
    const div = document.getElementById('upload-status');
    div.style.display = 'block';
    div.innerHTML = msg;
    if(type === 'info') { div.style.background = '#e0f2fe'; div.style.color = '#0284c7'; border: '1px solid #bae6fd';}
    if(type === 'success') { div.style.background = '#ecfdf5'; div.style.color = '#059669'; border: '1px solid #a7f3d0';}
    if(type === 'error') { div.style.background = '#fef2f2'; div.style.color = '#dc2626'; border: '1px solid #fecaca';}
}

document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const imageFile = document.getElementById('p-image').files[0];
    const submitBtn = document.getElementById('submit-btn');

    try {
        submitBtn.disabled = true;
        
        setStatus('<i class="fas fa-spinner fa-spin"></i> جاري ضغط الصورة...', 'info');
        const compressedBlob = await compressImage(imageFile);
        
        setStatus('<i class="fas fa-spinner fa-spin"></i> جاري الرفع باستخدام طريقة POST لـ ImgBB...', 'info');
        const formData = new FormData();
        formData.append('image', compressedBlob, 'mansaf_dish.jpg'); 
        
        // إرسال الطلب بطريقة POST السريعة والمستقرة
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.IMGBB_API_KEY}`, {
            method: 'POST', body: formData
        });
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error.message);
        
        const imageUrl = data.data.url;
        const deleteUrl = data.data.delete_url;

        setStatus('<i class="fas fa-spinner fa-spin"></i> جاري الحفظ في القائمة...', 'info');
        await addDoc(collection(db, CONFIG.COLLECTION_NAME), {
            name: name,
            price: Number(price),
            imageUrl: imageUrl,
            deleteUrl: deleteUrl,
            createdAt: serverTimestamp()
        });

        setStatus('<i class="fas fa-check-circle"></i> تم إضافة الصنف للقائمة بنجاح!', 'success');
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

function loadProducts() {
    const q = query(collection(db, CONFIG.COLLECTION_NAME), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('products-list');
        tbody.innerHTML = '';
        if(snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#0284c7; font-weight:bold;">لا توجد أصناف في القائمة حالياً</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const p = docSnap.data();
            const date = p.createdAt ? p.createdAt.toDate().toLocaleDateString('ar-EG') : 'الآن';
            tbody.innerHTML += `
                <tr>
                    <td><img src="${p.imageUrl}" class="prod-img-tbl"></td>
                    <td style="font-weight:900;">${p.name}</td>
                    <td style="color:#f59e0b; font-weight:900; font-size:18px;">${p.price}$</td>
                    <td style="font-weight:bold; color:#64748b;">${date}</td>
                    <td><button class="btn-danger" id="del-btn-${docSnap.id}" onclick="window.deleteProduct('${docSnap.id}', '${p.deleteUrl || ''}')"><i class="fas fa-trash"></i> إزالة</button></td>
                </tr>
            `;
        });
    });
}

window.deleteProduct = async function(id, deleteUrl) {
    if(!confirm("هل أنت متأكد من إزالة الصنف نهائياً من القائمة؟")) return;
    const btn = document.getElementById(`del-btn-${id}`);
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        if(deleteUrl) {
            try { await fetch(deleteUrl, { mode: 'no-cors' }); } 
            catch(e) { console.warn("تنبيه الحذف الخارجي", e); }
        }

        await deleteDoc(doc(db, CONFIG.COLLECTION_NAME, id));
    } catch (error) {
        alert("حدث خطأ أثناء الحذف!");
        console.error(error);
        btn.innerHTML = '<i class="fas fa-trash"></i> إزالة';
        btn.disabled = false;
    }
};

function loadOrders() {
    const q = query(collection(db, CONFIG.ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('orders-list');
        tbody.innerHTML = '';
        if(snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#0284c7; font-weight:bold;">لا توجد طلبات واردة حتى الآن.</td></tr>';
            return;
        }

        snapshot.forEach((doc) => {
            const o = doc.data();
            const date = o.createdAt ? o.createdAt.toDate().toLocaleString('ar-EG') : 'الآن';
            const itemsList = o.items.map(i => `<span style="background:#e0f2fe; color:#0284c7; padding:4px 8px; border-radius:6px; margin:2px; display:inline-block; font-weight:bold; border:1px solid #bae6fd;">${i.name}</span>`).join('');

            tbody.innerHTML += `
                <tr>
                    <td><span class="badge">${o.orderNumber}</span></td>
                    <td style="font-weight:900; color:#0f172a;">${o.customerName}</td>
                    <td dir="ltr" style="text-align:right; font-weight:bold; color:#334155;">${o.customerPhone}</td>
                    <td style="font-weight:bold; color:#475569;">${o.customerAddress}</td>
                    <td style="font-size:13px; max-width:250px;">${itemsList}</td>
                    <td style="font-weight:900; color:#10b981; font-size:16px;">${o.totalPrice}$</td>
                    <td style="font-size:13px; font-weight:bold; color:#64748b;">${date}</td>
                </tr>
            `;
        });
    });
}

window.onload = () => {
    loadProducts();
    loadOrders();
};
