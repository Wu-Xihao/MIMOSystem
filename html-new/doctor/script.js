function showContent(id) {
  // 隐藏所有内容区域
  document.querySelectorAll('main > div').forEach(div => div.classList.add('hidden'));

  // 显示指定ID的内容区域
  document.getElementById(id).classList.remove('hidden');

  // 根据id加载不同的数据
  switch (id) {
    case 'paper':
      loadPaperData();
      break;
    case 'record':
      loadRecordData();
      break;
    case 'drug':
      loadDrugData();
      break;
    case 'personal':
      loadPersonalData();
      break;
  }
}

// 修改loadPaperData函数
async function loadPaperData() {
    try {
        const response = await fetch('http://localhost:5000/get_all_papers', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '获取数据失败');
        }

        // 更新表格
        const tableBody = document.getElementById('paperTableBody');
        tableBody.innerHTML = '';

        data.papers.forEach(paper => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            // 保存完整记录数据到dataset
            row.dataset.paper = JSON.stringify(paper);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${paper.paperID}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${paper.WBC || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${paper.RBC || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${paper.HGB || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <button onclick="viewPaper(${paper.paperID})" class="text-blue-600 hover:text-blue-900 mr-3">
                        查看
                    </button>
                    <button onclick="deletePaper(${paper.paperID})" class="text-red-600 hover:text-red-900">
                        删除
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error:', error);
        alert('获取化验单失败：' + error.message);
    }
}

function addPaper() {
    document.getElementById('addPaperModal').classList.remove('hidden');
    document.getElementById('addPaperForm').reset(); // 重置表单
}

function closeAddPaperModal() {
    document.getElementById('addPaperModal').classList.add('hidden');
}

// 修改表单提交处理
document.getElementById('addPaperForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 获取表单数据
    const formData = new FormData(e.target);
    const paperData = {
        RBC: parseFloat(formData.get('RBC')),
        WBC: parseFloat(formData.get('WBC')),
        BASON: parseFloat(formData.get('BASON')),
        LYMPHN: parseFloat(formData.get('LYMPHN')),
        HGB: parseFloat(formData.get('HGB')),
        PLT: parseFloat(formData.get('PLT')),
        MONON: parseFloat(formData.get('MONON')),
        EON: parseFloat(formData.get('EON')),
        NEUT: parseFloat(formData.get('NEUT'))
    };

    try {
        // 验证数据
        validatePaperData(paperData);
        
        // 发送数据到后端
        const response = await fetch('http://localhost:5000/add_paper', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(paperData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || '添加失败');
        }
        
        // 刷新数据显示
        loadPaperData();
        
        // 关闭模态框
        closeAddPaperModal();
        
        // 显示成功消息
        alert('化验单添加成功！');
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || '提交失败，请重试！');
    }
});

// 添��数据验证函数
function validatePaperData(data) {
    const validationRules = {
        RBC: { min: 0, max: 10, message: '红细胞计数必须在0-10之间' },
        WBC: { min: 0, max: 50, message: '白细胞计数必须在0-50之间' },
        BASON: { min: 0, max: 1, message: '嗜碱性粒细胞必须在0-1之间' },
        LYMPHN: { min: 0, max: 10, message: '淋巴细胞必须在0-10之间' },
        HGB: { min: 0, max: 200, message: '血红蛋白必须在0-200之间' },
        PLT: { min: 0, max: 1000, message: '血小板计数必须在0-1000之间' },
        MONON: { min: 0, max: 2, message: '单核细胞必须在0-2之间' },
        EON: { min: 0, max: 1, message: '嗜酸性粒细胞必须在0-1之间' },
        NEUT: { min: 0, max: 20, message: '中性粒细胞必须在0-20之间' }
    };

    for (const [key, rule] of Object.entries(validationRules)) {
        const value = data[key];
        if (value < rule.min || value > rule.max) {
            throw new Error(rule.message);
        }
    }

    return true;
}

// 修改viewPaper函数，使用模态框显示详情
function viewPaper(paperID) {
    const rows = document.querySelectorAll('#paperTableBody tr');
    const row = Array.from(rows).find(row => {
        const paper = JSON.parse(row.dataset.paper);
        return paper.paperID === paperID;
    });

    if (row) {
        const paper = JSON.parse(row.dataset.paper);
        const paperDetails = document.getElementById('paperDetails');
        
        // 定义所有检测项及其正常范围
        const items = [
            { key: 'WBC', name: '白细胞计数', value: paper.WBC, unit: '×10⁹/L', range: '4-10' },
            { key: 'RBC', name: '红细胞计数', value: paper.RBC, unit: '×10¹²/L', range: '3.5-5.5' },
            { key: 'HGB', name: '血红蛋白', value: paper.HGB, unit: 'g/L', range: '110-160' },
            { key: 'PLT', name: '血小板计数', value: paper.PLT, unit: '×10⁹/L', range: '100-300' },
            { key: 'NEUT', name: '中性粒细胞百分比', value: paper.NEUT, unit: '%', range: '50-70' },
            { key: 'LYMPHN', name: '淋巴细胞百分比', value: paper.LYMPHN, unit: '%', range: '20-40' },
            { key: 'MONON', name: '单核细胞百分比', value: paper.MONON, unit: '%', range: '3-8' },
            { key: 'EON', name: '嗜酸性粒细胞百分比', value: paper.EON, unit: '%', range: '0.5-5' },
            { key: 'BASON', name: '嗜碱性粒细胞百分比', value: paper.BASON, unit: '%', range: '0-1' }
        ];

        // 生成详情HTML
        paperDetails.innerHTML = `
            <div class="col-span-2 mb-4">
                <h4 class="text-lg font-medium">化验单编号：${paper.paperID}</h4>
            </div>
            ${items.map(item => `
                <div class="p-4 border rounded-lg">
                    <div class="text-sm text-gray-500">${item.name}</div>
                    <div class="mt-1 text-lg font-semibold">${item.value || '-'} ${item.unit}</div>
                    <div class="mt-1 text-xs text-gray-400">正常范围：${item.range} ${item.unit}</div>
                </div>
            `).join('')}
        `;

        // 显示模态框
        document.getElementById('viewPaperModal').classList.remove('hidden');
    } else {
        alert('未找到该化验单');
    }
}

// 关闭化验单详情模态框
function closeViewPaperModal() {
    document.getElementById('viewPaperModal').classList.add('hidden');
}

// 修改deletePaper函数
async function deletePaper(paperID) {
    if (confirm(`确定要删除化验单 ${paperID} 吗？`)) {
        try {
            const response = await fetch(`http://localhost:5000/delete_paper/${paperID}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '删除失败');
            }

            if (data.success) {
                // 使用更兼容的方式从DOM中移除该行
                const rows = document.querySelectorAll('#paperTableBody tr');
                const row = Array.from(rows).find(row => {
                    const firstCell = row.querySelector('td:first-child');
                    return firstCell && firstCell.textContent.trim() === paperID.toString();
                });
                
                if (row) {
                    row.remove();
                }
                alert('删除成功！');
            } else {
                throw new Error(data.message || '删除失败');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('删除失败：' + error.message);
        }
    }
}

// 模拟用户数据
const currentUser = {
    userID: 10001,
    name: "张医生",
    gender: "男",
    level: "医生",
    birthDate: "1985-06-15"
};

function loadPersonalData() {
    // 填充个人信息
    document.getElementById('userID').textContent = currentUser.userID;
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userGender').textContent = currentUser.gender;
    document.getElementById('userLevel').textContent = currentUser.level;
    document.getElementById('userBirthDate').textContent = currentUser.birthDate;
    
    // 计算年龄
    const birthDate = new Date(currentUser.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    document.getElementById('userAge').textContent = `${age}岁`;
}

function editPersonalInfo() {
    // 编辑个人信息的模态框
    const confirmEdit = confirm("是否要编辑个��信息？");
    if (confirmEdit) {
        // 这里可以实现编辑功能，比如打开一个模态框
        alert('编辑功能待实现');
    }
}

// 模拟门诊记录数据
const sampleRecordData = [
    {
        recordID: 1,
        patientID: 20001,
        patientName: "李患者",
        doctorID: 10001,
        doctorName: "张医生",
        paperID: 1,
        createDate: "2024-03-20",
        status: "待开药"
    },
    {
        recordID: 2,
        patientID: 20002,
        patientName: "王患者",
        doctorID: 10001,
        doctorName: "张医生",
        paperID: null,
        createDate: "2024-03-19",
        status: "结束"
    }
];

// 加载门诊记录数据
async function loadRecordData() {
    try {
        const response = await fetch('http://localhost:5000/get_all_records', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '获取数据失败');
        }

        // 更新表���
        const tableBody = document.getElementById('recordTableBody');
        tableBody.innerHTML = '';

        data.records.forEach(record => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            // 保存完整记录数据到dataset
            row.dataset.record = JSON.stringify(record);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.recordID}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.patientName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.doctorName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.paperID || '无'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.createDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${record.status === '待开药' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                        ${record.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewRecord(${record.recordID})" class="text-blue-600 hover:text-blue-900 mr-3">
                        查看
                    </button>
                    <button onclick="editRecord(${record.recordID})" class="text-green-600 hover:text-green-900 mr-3">
                        编辑
                    </button>
                    <button onclick="deleteRecord(${record.recordID})" class="text-red-600 hover:text-red-900">
                        删除
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error:', error);
        alert('获取门诊记录失败：' + error.message);
    }
}

// 查看门诊记录详情
function viewRecord(recordID) {
    const rows = document.querySelectorAll('#recordTableBody tr');
    const row = Array.from(rows).find(row => {
        const record = JSON.parse(row.dataset.record);
        return record.recordID === recordID;
    });

    if (row) {
        const record = JSON.parse(row.dataset.record);
        alert(`
            门诊记录详情：
            记录编号：${record.recordID}
            病人编号：${record.patientID}
            ���人姓名：${record.patientName}
            医生编号：${record.doctorID}
            医生姓名：${record.doctorName}
            化验单编号：${record.paperID || '无'}
            创建日期：${record.createDate}
            状态：${record.status}
        `);
    } else {
        alert('未找到该门诊记录');
    }
}

function addRecord() {
    // 打开新增记录的模态框
    const newRecord = {
        patientID: prompt("请输入病人编号："),
        paperID: prompt("请输入化验单编号（可选）：") || null,
        createDate: new Date().toISOString().split('T')[0],
        status: "待开药"
    };

    if (newRecord.patientID) {
        newRecord.recordID = sampleRecordData.length + 1;
        newRecord.doctorID = currentUser.userID;
        newRecord.doctorName = currentUser.name;
        newRecord.patientName = "新患者"; // 实际应用中需要根据patientID查询患者信息

        sampleRecordData.push(newRecord);
        loadRecordData();
    }
}

// 编辑门诊记录
function editRecord(recordID) {
    const rows = document.querySelectorAll('#recordTableBody tr');
    const row = Array.from(rows).find(row => {
        const record = JSON.parse(row.dataset.record);
        return record.recordID === recordID;
    });

    if (row) {
        const record = JSON.parse(row.dataset.record);
        // 填充表单
        const form = document.getElementById('editRecordForm');
        form.elements['patientID'].value = record.patientID;
        form.elements['doctorID'].value = record.doctorID;
        form.elements['paperID'].value = record.paperID || '';
        form.elements['createDate'].value = record.createDate;
        form.elements['status'].value = record.status;
        
        // 保存当前编辑的记录ID
        form.dataset.recordId = recordID;
        
        // 显示模态框
        document.getElementById('editRecordModal').classList.remove('hidden');
    }
}

// 关闭编辑模态框
function closeEditRecordModal() {
    document.getElementById('editRecordModal').classList.add('hidden');
    document.getElementById('editRecordForm').reset();
}

// 处理编辑表单提交
document.getElementById('editRecordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const recordID = this.dataset.recordId;
    const formData = new FormData(e.target);
    const recordData = {
        patientID: parseInt(formData.get('patientID')),
        doctorID: parseInt(formData.get('doctorID')),
        paperID: formData.get('paperID') ? parseInt(formData.get('paperID')) : null,
        createDate: formData.get('createDate'),
        status: formData.get('status')
    };

    try {
        const response = await fetch(`http://localhost:5000/update_record/${recordID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(recordData)
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || '更新失败');
        }
        
        // 刷新数据显示
        loadRecordData();
        
        // 关闭模态框
        closeEditRecordModal();
        
        alert('更新成功！');
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || '更新失败，请重试！');
    }
});

function deleteRecord(recordID) {
    if (confirm(`确定要删除门诊记录 ${recordID} 吗？`)) {
        sampleRecordData = sampleRecordData.filter(record => record.recordID !== recordID);
        loadRecordData();
    }
}

// 模拟药品数据
const sampleDrugData = [
    {
        drugID: 1,
        name: "阿莫西林胶囊",
        description: "用于敏菌所致的感染，如咽喉炎、扁桃体炎、支气管炎等"
    },
    {
        drugID: 2,
        name: "布洛芬片",
        description: "用于缓解轻至中度疼痛如头痛、关节痛、偏头痛、牙痛、肌肉痛、神经痛、痛经"
    },
    {
        drugID: 3,
        name: "感冒灵颗粒",
        description: "用于感冒引起的头痛、发热、鼻塞、流涕、咽痛等"
    }
];

// 模拟药品记录数据
const sampleDrugRecordData = [
    {
        recordDrugID: 1,
        recordID: 1,
        drugID: 1,
        drugName: "阿莫西林胶囊",
        quantity: 2,
        patientName: "李患者",
        createDate: "2024-03-20"
    },
    {
        recordDrugID: 2,
        recordID: 1,
        drugID: 2,
        drugName: "布洛芬片",
        quantity: 1,
        patientName: "李患者",
        createDate: "2024-03-20"
    }
];

// 加载药品记录数据
async function loadDrugData() {
    try {
        const response = await fetch('http://localhost:5000/get_all_drug_records', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '获取数据失败');
        }

        // 更新表格
        const tableBody = document.getElementById('drugRecordTableBody');
        tableBody.innerHTML = '';

        data.records.forEach(record => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            // 保存完整记录数据到dataset
            row.dataset.record = JSON.stringify(record);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.recordID}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.drugName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.quantity}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.patientName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.createDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editDrugRecord(${record.recordDrugID})" class="text-green-600 hover:text-green-900 mr-3">
                        编辑
                    </button>
                    <button onclick="deleteDrugRecord(${record.recordDrugID})" class="text-red-600 hover:text-red-900">
                        删除
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error:', error);
        alert('获取药品记录失败：' + error.message);
    }
}

// 显示药品列表
async function showDrugList() {
    try {
        const response = await fetch('http://localhost:5000/get_all_drugs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '获取数据失败');
        }

        // 显示模态框
        const modal = document.getElementById('drugListModal');
        modal.classList.remove('hidden');
        
        // 更新表格
        const tableBody = document.getElementById('drugListTableBody');
        tableBody.innerHTML = '';

        data.drugs.forEach(drug => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 cursor-pointer';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${drug.drugID}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${drug.name}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${drug.description || '暂无介绍'}</td>
            `;
            
            // 添加点击事件
            row.addEventListener('click', () => {
                // 将药品ID复制到剪贴板
                navigator.clipboard.writeText(drug.drugID);
                alert(`已复制药品ID: ${drug.drugID}\n药品名称: ${drug.name}`);
            });
            
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error:', error);
        alert('获取药品列表失败：' + error.message);
    }
}

// 关闭药品列表模态框
function closeDrugList() {
    document.getElementById('drugListModal').classList.add('hidden');
}

function addDrugRecord() {
    document.getElementById('addDrugRecordModal').classList.remove('hidden');
}

// 关闭开具药品模态框
function closeAddDrugRecordModal() {
    document.getElementById('addDrugRecordModal').classList.add('hidden');
    document.getElementById('addDrugRecordForm').reset();
}

// 处理开具药品表单提交
document.getElementById('addDrugRecordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const drugRecordData = {
        recordID: parseInt(formData.get('recordID')),
        drugID: parseInt(formData.get('drugID')),
        quantity: parseInt(formData.get('quantity')),
        completeRecord: formData.get('completeRecord') === 'on'
    };

    try {
        const response = await fetch('http://localhost:5000/add_drug_record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(drugRecordData)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        // 刷新数据显示
        loadDrugData();
        // 如果完成门诊，也刷新门诊记录
        if (drugRecordData.completeRecord) {
            loadRecordData();
        }
        
        // 关闭模态框
        closeAddDrugRecordModal();
        
        alert('药品开具成功！');

    } catch (error) {
        console.error('Error:', error);
        alert(error.message || '开具药品失败，请重试！');
    }
});

// 修改showDrugList函数，支持选择药品
async function showDrugList() {
    try {
        const response = await fetch('http://localhost:5000/get_all_drugs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '获取数据失败');
        }

        // 显示模态框
        const modal = document.getElementById('drugListModal');
        modal.classList.remove('hidden');
        
        // 更新表格
        const tableBody = document.getElementById('drugListTableBody');
        tableBody.innerHTML = '';

        data.drugs.forEach(drug => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 cursor-pointer';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${drug.drugID}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${drug.name}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${drug.description || '暂无介绍'}</td>
            `;
            
            // 添加点击事件
            row.addEventListener('click', () => {
                // 填充药品ID到表单
                document.querySelector('input[name="drugID"]').value = drug.drugID;
                // 关闭药品列表模态框
                closeDrugList();
            });
            
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error:', error);
        alert('获取药品列表失败：' + error.message);
    }
}

function editDrugRecord(recordDrugID) {
    const record = sampleDrugRecordData.find(r => r.recordDrugID === recordDrugID);
    if (!record) return;

    const newQuantity = prompt("请输入新的数量：", record.quantity);
    if (newQuantity && !isNaN(newQuantity)) {
        record.quantity = parseInt(newQuantity);
        loadDrugData();
    }
}

function deleteDrugRecord(recordDrugID) {
    if (confirm(`确定要删除这条用药记录吗？`)) {
        sampleDrugRecordData = sampleDrugRecordData.filter(record => record.recordDrugID !== recordDrugID);
        loadDrugData();
    }
}

// 添加门诊记录
async function addRecord() {
    // 显示添加记录的模态框
    document.getElementById('addRecordModal').classList.remove('hidden');
}

// 关闭添加记录模态框
function closeAddRecordModal() {
    document.getElementById('addRecordModal').classList.add('hidden');
    document.getElementById('addRecordForm').reset();
}

// 处理添加记录表单提交
document.getElementById('addRecordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 获取表单数据
    const formData = new FormData(e.target);
    const recordData = {
        patientID: parseInt(formData.get('patientID')),
        doctorID: parseInt(formData.get('doctorID')),
        paperID: formData.get('paperID') ? parseInt(formData.get('paperID')) : null,
        createDate: formData.get('createDate'),
        status: formData.get('status')
    };

    try {
        // 发送数据到后端
        const response = await fetch('http://localhost:5000/add_record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(recordData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || '添加失败');
        }
        
        // 刷新数据显示
        loadRecordData();
        
        // 关闭模态框
        closeAddRecordModal();
        
        // 显示成功消息
        alert('门诊记录添加成功！');
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || '提交失败，请重试！');
    }
});

// 删除门诊记录
async function deleteRecord(recordID) {
    if (confirm(`确定要删除门诊记录 ${recordID} 吗？`)) {
        try {
            const response = await fetch(`http://localhost:5000/delete_record/${recordID}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '删除失败');
            }

            if (data.success) {
                // 使用更兼容的方式从DOM中移除该行
                const rows = document.querySelectorAll('#recordTableBody tr');
                const row = Array.from(rows).find(row => {
                    const record = JSON.parse(row.dataset.record);
                    return record.recordID === recordID;
                });
                
                if (row) {
                    row.remove();
                }
                alert('删除成功！');
            } else {
                throw new Error(data.message || '删除失败');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('删除失败：' + error.message);
        }
    }
}

// 加载个人信息
async function loadPersonalInfo() {
    try {
        const response = await fetch('http://localhost:5000/get_user_info', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '获取数据失败');
        }

        const user = data.user;
        
        // 更新页面显示
        document.getElementById('userID').textContent = user.userID;
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userGender').textContent = user.gender;
        document.getElementById('userLevel').textContent = user.level;
        document.getElementById('userBirthDate').textContent = user.birthDate;
        // 计算年龄
        const birthDate = new Date(user.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        document.getElementById('userAge').textContent = age;

    } catch (error) {
        console.error('Error:', error);
        alert('获取个人信息失败：' + error.message);
    }
}

// 在页面加载时调用
document.addEventListener('DOMContentLoaded', function() {
    // 其他初始化代码...
    
    // 当切换到个人中心时加载数据
    const personalLink = document.querySelector('a[onclick="showContent(\'personal\')"]');
    if (personalLink) {
        personalLink.addEventListener('click', loadPersonalInfo);
    }
});

