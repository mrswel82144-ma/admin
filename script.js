// مفتاح رفع الصور المجاني الذي استخدمته سابقاً
const IMGBB_API_KEY = "872edef7066f0226f009e515daa0f951";

// التبديل بين التبويبات السفلية
window.switchTab = function(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId + '-tab').classList.add('active');
    btn.classList.add('active');
    renderData();
};

// النوافذ المنبثقة
window.showForm = function(formId) {
    document.getElementById('modal-overlay').style.display = 'flex';
    document.querySelectorAll('.modal-card').forEach(f => f.style.display = 'none');
    document.getElementById(formId).style.display = 'flex';
    
    // تعبئة الأقسام داخل فورم المنتجات
    if(formId === 'product-form') {
        let cats = JSON.parse(localStorage.getItem('categories')) || [];
        let select = document.getElementById('p-category');
        select.innerHTML = '<option value="">اختر القسم</option>';
        cats.forEach(c => select.innerHTML += `<option value="${c.name}">${c.name}</option>`);
    }
};
window.closeForm = function() { document.getElementById('modal-overlay').style.display = 'none'; };

// دالة رفع الصور
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

// 1. إضافة وحذف المنتجات
document.getElementById('product-form').onsubmit = async function(e) {
    e.preventDefault();
    let btn = this.querySelector('button[type="submit"]');
    btn.innerText = "جاري الرفع..."; btn.disabled = true;
    
    let imgUrl = await uploadImage(document.getElementById('p-img').files[0]);
    if(imgUrl) {
        let prods = JSON.parse(localStorage.getItem('products')) || [];
        prods.push({
            id: Date.now(),
            name: document.getElementById('p-name').value,
            category: document.getElementById('p-category').value,
            desc: document.getElementById('p-desc').value,
            price: document.getElementById('p-price').value,
            image: imgUrl
        });
        localStorage.setItem('products', JSON.stringify(prods));
        closeForm(); this.reset(); renderData();
    }
    btn.innerText = "حفظ المنتج"; btn.disabled = false;
};

window.deleteProduct = function(id) {
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    prods = prods.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(prods));
    renderData();
};

// 2. إضافة وحذف الأقسام
document.getElementById('category-form').onsubmit = async function(e) {
    e.preventDefault();
    let btn = this.querySelector('button[type="submit"]');
    btn.innerText = "جاري الرفع..."; btn.disabled = true;
    
    let imgUrl = await uploadImage(document.getElementById('c-img').files[0]);
    if(imgUrl) {
        let cats = JSON.parse(localStorage.getItem('categories')) || [];
        cats.push({ id: Date.now(), name: document.getElementById('c-name').value, image: imgUrl });
        localStorage.setItem('categories', JSON.stringify(cats));
        closeForm(); this.reset(); renderData();
    }
    btn.innerText = "حفظ القسم"; btn.disabled = false;
};

window.deleteCategory = function(id) {
    let cats = JSON.parse(localStorage.getItem('categories')) || [];
    cats = cats.filter(c => c.id !== id);
    localStorage.setItem('categories', JSON.stringify(cats));
    renderData();
};

// 3. إضافة وحذف البنرات
document.getElementById('banner-form').onsubmit = async function(e) {
    e.preventDefault();
    let btn = this.querySelector('button[type="submit"]');
    btn.innerText = "جاري الرفع..."; btn.disabled = true;
    
    let imgUrl = await uploadImage(document.getElementById('b-img').files[0]);
    if(imgUrl) {
        let banners = JSON.parse(localStorage.getItem('banners')) || [];
        banners.push({ id: Date.now(), image: imgUrl });
        localStorage.setItem('banners', JSON.stringify(banners));
        closeForm(); this.reset(); renderData();
    }
    btn.innerText = "رفع الإعلان"; btn.disabled = false;
};

window.deleteBanner = function(id) {
    let banners = JSON.parse(localStorage.getItem('banners')) || [];
    banners = banners.filter(b => b.id !== id);
    localStorage.setItem('banners', JSON.stringify(banners));
    renderData();
};

// 4. الطلبات (المعلقة والمنتهية)
window.filterOrders = function(status) {
    document.querySelectorAll('.order-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(status === 'pending' ? 'btn-pending' : 'btn-completed').classList.add('active');
    
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    let filtered = orders.filter(o => o.status === status);
    let container = document.getElementById('orders-list');
    container.innerHTML = '';
    
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
                ${status === 'pending' ? `<button class="btn-approve mt-15" onclick="completeOrder(${o.id})"><i class="fas fa-check"></i> نقل للمنتهية</button>` : ''}
                <button class="btn-del mt-15" onclick="deleteOrder(${o.id})"><i class="fas fa-trash"></i> حذف</button>
            </div>
        `;
    });
};

window.completeOrder = function(id) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    let order = orders.find(o => o.id === id);
    if(order) order.status = 'completed';
    localStorage.setItem('orders', JSON.stringify(orders));
    filterOrders('pending');
};
window.deleteOrder = function(id) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders = orders.filter(o => o.id !== id);
    localStorage.setItem('orders', JSON.stringify(orders));
    filterOrders(document.getElementById('btn-pending').classList.contains('active') ? 'pending' : 'completed');
};

// 5. التوصيل
window.saveDeliveryPrice = function() {
    let val = document.getElementById('delivery-price-input').value;
    localStorage.setItem('deliveryPrice', val);
    alert('تم حفظ سعر التوصيل وسينعكس في المتجر.');
};

// دالة جلب وعرض كل البيانات
function renderData() {
    // عرض المنتجات
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    let prodContainer = document.getElementById('product-list');
    prodContainer.innerHTML = '';
    prods.forEach(p => {
        prodContainer.innerHTML += `
            <div class="card">
                <img src="${p.image}">
                <div class="item-info"><h4>${p.name}</h4><p>${Number(p.price).toLocaleString()} د.ع - ${p.category}</p></div>
                <button class="btn-del" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
            </div>`;
    });

    // عرض الأقسام
    let cats = JSON.parse(localStorage.getItem('categories')) || [];
    let catContainer = document.getElementById('category-list');
    catContainer.innerHTML = '';
    cats.forEach(c => {
        catContainer.innerHTML += `
            <div class="card grid-item">
                <img src="${c.image}">
                <h4>${c.name}</h4>
                <button class="btn-del" onclick="deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
            </div>`;
    });

    // عرض البنرات
    let banners = JSON.parse(localStorage.getItem('banners')) || [];
    let banContainer = document.getElementById('banner-list');
    banContainer.innerHTML = '';
    banners.forEach(b => {
        banContainer.innerHTML += `
            <div class="card banner-item">
                <img src="${b.image}">
                <button class="btn-del" onclick="deleteBanner(${b.id})"><i class="fas fa-trash"></i> إزالة</button>
            </div>`;
    });

    // جلب التوصيل
    document.getElementById('delivery-price-input').value = localStorage.getItem('deliveryPrice') || 0;
    
    // جلب الطلبات
    filterOrders(document.getElementById('btn-pending').classList.contains('active') ? 'pending' : 'completed');
}

// تشغيل عند التحميل
window.onload = renderData;
