function fetchRecord() {
    const recordID = document.getElementById('recordID').value;

    // 如果没有输入记录ID，则弹出提示
    if (!recordID) {
        alert("请输入门诊记录ID！");
        return;
    }

    // 向后端发送请求，获取门诊记录数据
    fetch(`http://127.0.0.1:5000/get_record_details/${recordID}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 显示门诊记录信息
                const recordDetailsDiv = document.getElementById('record-details');
                const record = data.record;
                recordDetailsDiv.innerHTML = `
                    <p><strong>患者 ID:</strong> ${record.patientID}</p>
                    <p><strong>医生 ID:</strong> ${record.doctorID}</p>
                    <p><strong>创建日期:</strong> ${formatDate(record.createDate)}</p> <!-- 格式化日期 -->
                    <p><strong>状态:</strong> ${record.status}</p>
                `;

                // 如果有化验单，获取化验单数据
                if (data.paper) {
                    populatePaperTable(data.paper);
                }
            } else {
                alert("未找到该门诊记录！");
            }
        })
        .catch(error => {
            console.error("Error fetching record:", error);
        });
}

// populatePaperTable 函数用于将化验单数据填充到表格中
function populatePaperTable(paper) {
    const tableBody = document.getElementById('paper-table-body');
    tableBody.innerHTML = `
        <tr>
            <td><h6 class="fw-semibold mb-0">RBC</h6></td>
            <td><h6 class="fw-semibold mb-1">红细胞</h6></td>
            <td><span class="badge bg-secondary rounded-3 fw-semibold">${paper.RBC}</span></td>
            <td><p class="mb-0 fw-normal">10^12/L</p></td>
            <td><span class="badge bg-primary rounded-3 fw-semibold">3.5-5.5</span></td>
        </tr>
        <tr>
            <td><h6 class="fw-semibold mb-0">WBC</h6></td>
            <td><h6 class="fw-semibold mb-1">白细胞</h6></td>
            <td><span class="badge bg-secondary rounded-3 fw-semibold">${paper.WBC}</span></td>
            <td><p class="mb-0 fw-normal">10^9/L</p></td>
            <td><span class="badge bg-primary rounded-3 fw-semibold">4-10</span></td>
        </tr>
        <tr>
            <td><h6 class="fw-semibold mb-0">BASON</h6></td>
            <td><h6 class="fw-semibold mb-1">嗜碱性粒细胞</h6></td>
            <td><span class="badge bg-secondary rounded-3 fw-semibold">${paper.BASON}</span></td>
            <td><p class="mb-0 fw-normal">10^9/L</p></td>
            <td><span class="badge bg-primary rounded-3 fw-semibold">0.01-0.07</span></td>
        </tr>
        <tr>
            <td><h6 class="fw-semibold mb-0">LYMPHN</h6></td>
            <td><h6 class="fw-semibold mb-1">淋巴细胞</h6></td>
            <td><span class="badge bg-secondary rounded-3 fw-semibold">${paper.LYMPHN}</span></td>
            <td><p class="mb-0 fw-normal">10^9/L</p></td>
            <td><span class="badge bg-primary rounded-3 fw-semibold">1.26-3.35</span></td>
        </tr>
        <tr>
            <td><h6 class="fw-semibold mb-0">HGB</h6></td>
            <td><h6 class="fw-semibold mb-1">血红蛋白</h6></td>
            <td><span class="badge bg-secondary rounded-3 fw-semibold">${paper.HGB}</span></td>
            <td><p class="mb-0 fw-normal">g/L</p></td>
            <td><span class="badge bg-primary rounded-3 fw-semibold">110-160</span></td>
        </tr>
        <tr>
            <td><h6 class="fw-semibold mb-0">PLT</h6></td>
            <td><h6 class="fw-semibold mb-1">血小板</h6></td>
            <td><span class="badge bg-secondary rounded-3 fw-semibold">${paper.PLT}</span></td>
            <td><p class="mb-0 fw-normal">10^9/L</p></td>
            <td><span class="badge bg-primary rounded-3 fw-semibold">100-300</span></td>
        </tr>
        <tr>
            <td><h6 class="fw-semibold mb-0">MONON</h6></td>
            <td><h6 class="fw-semibold mb-1">单核细胞</h6></td>
            <td><span class="badge bg-secondary rounded-3 fw-semibold">${paper.MONON}</span></td>
            <td><p class="mb-0 fw-normal">10^9/L</p></td>
            <td><span class="badge bg-primary rounded-3 fw-semibold">0.25-0.95</span></td>
        </tr>
        <tr>
            <td><h6 class="fw-semibold mb-0">EON</h6></td>
            <td><h6 class="fw-semibold mb-1">嗜酸性粒细胞</h6></td>
            <td><span class="badge bg-secondary rounded-3 fw-semibold">${paper.EON}</span></td>
            <td><p class="mb-0 fw-normal">10^9/L</p></td>
            <td><span class="badge bg-primary rounded-3 fw-semibold">0.01-0.59</span></td>
        </tr>
        <tr>
            <td><h6 class="fw-semibold mb-0">NEUT</h6></td>
            <td><h6 class="fw-semibold mb-1">中性粒细胞</h6></td>
            <td><span class="badge bg-secondary rounded-3 fw-semibold">${paper.MONON}</span></td>
            <td><p class="mb-0 fw-normal">10^9/L</p></td>
            <td><span class="badge bg-primary rounded-3 fw-semibold">1.8-8.89</span></td>
        </tr>
        
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
