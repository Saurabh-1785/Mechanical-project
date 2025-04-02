// Global truss data
const trussData = {
    nodes: {},
    members: [],
    supports: {},
    loads: {},
    results: null
};

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all tabs
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Activate selected tab
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
    
    // Results tab switching
    const resultTabBtns = document.querySelectorAll('.results-tab-btn');
    resultTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all tabs
            document.querySelectorAll('.results-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.results-tab-content').forEach(c => c.classList.remove('active'));
            
            // Activate selected tab
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
    
    // Add node button
    document.getElementById('add-node').addEventListener('click', addNode);
    
    // Add member button
    document.getElementById('add-member').addEventListener('click', addMember);
    
    // Add support button
    document.getElementById('add-support').addEventListener('click', addSupport);
    
    // Add load button
    document.getElementById('add-load').addEventListener('click', addLoad);
    
    // Analyze button
    document.getElementById('analyze-truss').addEventListener('click', analyzeTruss);
    
    // Clear button
    document.getElementById('clear-truss').addEventListener('click', clearAll);
    
    // Load example button
    document.getElementById('load-example').addEventListener('click', loadExample);
    
    // Initialize canvas
    initCanvas();
});

// Initialize canvas
function initCanvas() {
    const canvas = document.getElementById('truss-canvas');
    if (!canvas.getContext) {
        console.error('Canvas not supported');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Initial blank canvas
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ddd';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
}

// Draw grid on canvas
function drawGrid(ctx, width, height) {
    const gridSize = 20;
    
    ctx.beginPath();
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = gridSize; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    
    // Horizontal lines
    for (let y = gridSize; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    
    ctx.stroke();
}

// Add node function
function addNode() {
    const nodeId = document.getElementById('node-id').value;
    const nodeX = parseFloat(document.getElementById('node-x').value);
    const nodeY = parseFloat(document.getElementById('node-y').value);
    
    if (!nodeId || isNaN(nodeX) || isNaN(nodeY)) {
        alert('Please enter valid node information!');
        return;
    }
    
    if (nodeId in trussData.nodes) {
        alert('Node ID already exists!');
        return;
    }
    
    // Add node to data
    trussData.nodes[nodeId] = [nodeX, nodeY];
    
    // Add node to table
    const nodeTable = document.querySelector('#node-table tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${nodeId}</td>
        <td>${nodeX}</td>
        <td>${nodeY}</td>
        <td><button class="delete-btn" onclick="deleteNode('${nodeId}')">Delete</button></td>
    `;
    nodeTable.appendChild(row);
    
    // Update node options in dropdowns
    updateNodeOptions();
    
    // Clear inputs
    document.getElementById('node-id').value = '';
    document.getElementById('node-x').value = '';
    document.getElementById('node-y').value = '';
    
    // Redraw truss
    drawTruss();
}

// Delete node function
function deleteNode(nodeId) {
    // Check if node is used in any member
    for (const member of trussData.members) {
        if (member[0] === nodeId || member[1] === nodeId) {
            alert('Cannot delete node that is part of a member!');
            return;
        }
    }
    
    // Check if node has support or load
    if (nodeId in trussData.supports) {
        alert('Cannot delete node that has a support!');
        return;
    }
    
    if (nodeId in trussData.loads) {
        alert('Cannot delete node that has a load!');
        return;
    }
    
    // Remove node from data
    delete trussData.nodes[nodeId];
    
    // Remove node from table
    const rows = document.querySelectorAll('#node-table tbody tr');
    rows.forEach(row => {
        if (row.cells[0].textContent === nodeId) {
            row.remove();
        }
    });
    
    // Update node options in dropdowns
    updateNodeOptions();
    
    // Redraw truss
    drawTruss();
}

// Update node options in all dropdowns
function updateNodeOptions() {
    const nodeSelects = [
        document.getElementById('member-node1'),
        document.getElementById('member-node2'),
        document.getElementById('support-node'),
        document.getElementById('load-node')
    ];
    
    nodeSelects.forEach(select => {
        // Save current selection
        const currentValue = select.value;
        
        // Clear options
        select.innerHTML = '<option value="">Select Node</option>';
        
        // Add options for each node
        for (const nodeId in trussData.nodes) {
            const option = document.createElement('option');
            option.value = nodeId;
            option.textContent = nodeId;
            select.appendChild(option);
        }
        
        // Restore selection if possible
        if (currentValue in trussData.nodes) {
            select.value = currentValue;
        }
    });
}

// Add member function
function addMember() {
    const node1 = document.getElementById('member-node1').value;
    const node2 = document.getElementById('member-node2').value;
    
    if (!node1 || !node2) {
        alert('Please select both nodes!');
        return;
    }
    
    if (node1 === node2) {
        alert('Cannot create member with same start and end node!');
        return;
    }
    
    // Check if member already exists
    for (const member of trussData.members) {
        if ((member[0] === node1 && member[1] === node2) || (member[0] === node2 && member[1] === node1)) {
            alert('Member already exists!');
            return;
        }
    }
    
    // Add member to data
    trussData.members.push([node1, node2]);
    
    // Add member to table
    const memberTable = document.querySelector('#member-table tbody');
    const row = document.createElement('tr');
    const memberIndex = trussData.members.length;
    row.innerHTML = `
        <td>M${memberIndex}</td>
        <td>${node1}</td>
        <td>${node2}</td>
        <td><button class="delete-btn" onclick="deleteMember(${memberIndex - 1})">Delete</button></td>
    `;
    memberTable.appendChild(row);
    
    // Clear selections
    document.getElementById('member-node1').value = '';
    document.getElementById('member-node2').value = '';
    
    // Redraw truss
    drawTruss();
}

// Delete member function
function deleteMember(index) {
    // Remove member from data
    trussData.members.splice(index, 1);
    
    // Rebuild member table
    const memberTable = document.querySelector('#member-table tbody');
    memberTable.innerHTML = '';
    
    trussData.members.forEach((member, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>M${i + 1}</td>
            <td>${member[0]}</td>
            <td>${member[1]}</td>
            <td><button class="delete-btn" onclick="deleteMember(${i})">Delete</button></td>
        `;
        memberTable.appendChild(row);
    });
    
    // Redraw truss
    drawTruss();
}

// Add support function
function addSupport() {
    const nodeId = document.getElementById('support-node').value;
    const fixedX = document.getElementById('support-x').checked;
    const fixedY = document.getElementById('support-y').checked;
    
    if (!nodeId) {
        alert('Please select a node!');
        return;
    }
    
    if (!(fixedX || fixedY)) {
        alert('At least one direction must be fixed!');
        return;
    }
    
    // Add support to data
    trussData.supports[nodeId] = [fixedX, fixedY];
    
    // Add or update support in table
    const supportTable = document.querySelector('#support-table tbody');
    const rows = supportTable.querySelectorAll('tr');
    let existingRow = null;
    
    rows.forEach(row => {
        if (row.cells[0].textContent === nodeId) {
            existingRow = row;
        }
    });
    
    if (existingRow) {
        existingRow.cells[1].textContent = fixedX ? 'Yes' : 'No';
        existingRow.cells[2].textContent = fixedY ? 'Yes' : 'No';
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nodeId}</td>
            <td>${fixedX ? 'Yes' : 'No'}</td>
            <td>${fixedY ? 'Yes' : 'No'}</td>
            <td><button class="delete-btn" onclick="deleteSupport('${nodeId}')">Delete</button></td>
        `;
        supportTable.appendChild(row);
    }
    
    // Clear selection
    document.getElementById('support-node').value = '';
    document.getElementById('support-x').checked = true;
    document.getElementById('support-y').checked = true;
    
    // Redraw truss
    drawTruss();
}

// Delete support function
function deleteSupport(nodeId) {
    // Remove support from data
    delete trussData.supports[nodeId];
    
    // Remove support from table
    const rows = document.querySelectorAll('#support-table tbody tr');
    rows.forEach(row => {
        if (row.cells[0].textContent === nodeId) {
            row.remove();
        }
    });
    
    // Redraw truss
    drawTruss();
}

// Add load function
function addLoad() {
    const nodeId = document.getElementById('load-node').value;
    const loadX = parseFloat(document.getElementById('load-x').value) || 0;
    const loadY = parseFloat(document.getElementById('load-y').value) || 0;
    
    if (!nodeId) {
        alert('Please select a node!');
        return;
    }
    
    if (loadX === 0 && loadY === 0) {
        alert('At least one load component must be non-zero!');
        return;
    }
    
    // Add load to data
    trussData.loads[nodeId] = [loadX, loadY];
    
    // Add or update load in table
    const loadTable = document.querySelector('#load-table tbody');
    const rows = loadTable.querySelectorAll('tr');
    let existingRow = null;
    
    rows.forEach(row => {
        if (row.cells[0].textContent === nodeId) {
            existingRow = row;
        }
    });
    
    if (existingRow) {
        existingRow.cells[1].textContent = loadX;
        existingRow.cells[2].textContent = loadY;
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nodeId}</td>
            <td>${loadX}</td>
            <td>${loadY}</td>
            <td><button class="delete-btn" onclick="deleteLoad('${nodeId}')">Delete</button></td>
        `;
        loadTable.appendChild(row);
    }
    
    // Clear inputs
    document.getElementById('load-node').value = '';
    document.getElementById('load-x').value = '';
    document.getElementById('load-y').value = '';
    
    // Redraw truss
    drawTruss();
}

// Delete load function
function deleteLoad(nodeId) {
    // Remove load from data
    delete trussData.loads[nodeId];
    
    // Remove load from table
    const rows = document.querySelectorAll('#load-table tbody tr');
    rows.forEach(row => {
        if (row.cells[0].textContent === nodeId) {
            row.remove();
        }
    });
    
    // Redraw truss
    drawTruss();
}

// Analyze truss function
function analyzeTruss() {
    // Check if truss is properly defined
    if (Object.keys(trussData.nodes).length < 2) {
        alert('At least 2 nodes are required!');
        return;
    }
    
    if (trussData.members.length < 1) {
        alert('At least 1 member is required!');
        return;
    }
    
    if (Object.keys(trussData.supports).length < 1) {
        alert('At least 1 support is required!');
        return;
    }
    
    if (Object.keys(trussData.loads).length < 1) {
        alert('At least 1 load is required!');
        return;
    }
    
    // Prepare data for POST request
    const data = {
        nodes: trussData.nodes,
        members: trussData.members,
        supports: trussData.supports,
        loads: trussData.loads
    };
    
    // Send data to server
    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(results => {
        // Store results
        trussData.results = results;
        
        // Display results
        displayResults(results);
        
        // Redraw truss with results
        drawTruss();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error analyzing truss!');
    });
}

// Display results function
function displayResults(results) {
    // Display member forces
    const forcesTable = document.querySelector('#forces-table tbody');
    forcesTable.innerHTML = '';
    
    for (const [i, member] of trussData.members.entries()) {
        const [nodeI, nodeJ] = member;
        const force = results.member_forces[`${nodeI},${nodeJ}`];
        const status = force > 0 ? 'Tension' : force < 0 ? 'Compression' : 'Zero';
        const absForce = Math.abs(force).toFixed(4);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>M${i + 1} (${nodeI}-${nodeJ})</td>
            <td>${absForce}</td>
            <td class="${status.toLowerCase()}">${status}</td>
        `;
        forcesTable.appendChild(row);
    }
    
    // Display nodal displacements
    const displacementTable = document.querySelector('#displacement-table tbody');
    displacementTable.innerHTML = '';
    
    for (const nodeId in results.displacements) {
        const [dx, dy] = results.displacements[nodeId];
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nodeId}</td>
            <td>${dx.toFixed(6)}</td>
            <td>${dy.toFixed(6)}</td>
        `;
        displacementTable.appendChild(row);
    }
}

// Clear all function
function clearAll() {
    if (!confirm('Are you sure you want to clear all data?')) {
        return;
    }
    
    // Clear data
    trussData.nodes = {};
    trussData.members = [];
    trussData.supports = {};
    trussData.loads = {};
    trussData.results = null;
    
    // Clear tables
    document.querySelector('#node-table tbody').innerHTML = '';
    document.querySelector('#member-table tbody').innerHTML = '';
    document.querySelector('#support-table tbody').innerHTML = '';
    document.querySelector('#load-table tbody').innerHTML = '';
    document.querySelector('#forces-table tbody').innerHTML = '';
    document.querySelector('#displacement-table tbody').innerHTML = '';
    
    // Update node options
    updateNodeOptions();
    
    // Redraw truss
    drawTruss();
}

// Load example function
function loadExample() {
    // Clear current data
    clearAll();
    
    // Define example nodes
    trussData.nodes = {
        '1': [0, 0],
        '2': [4, 0],
        '3': [8, 0],
        '4': [2, 3],
        '5': [6, 3]
    };
    
    // Define example members
    trussData.members = [
        ['1', '2'],
        ['2', '3'],
        ['1', '4'],
        ['2', '4'],
        ['2', '5'],
        ['3', '5'],
        ['4', '5']
    ];
    
    // Define example supports
    trussData.supports = {
        '1': [true, true],
        '3': [false, true]
    };
    
    // Define example loads
    trussData.loads = {
        '4': [0, -10],
        '5': [0, -10]
    };
    
    // Update tables
    updateNodeTable();
    updateMemberTable();
    updateSupportTable();
    updateLoadTable();
    
    // Update node options
    updateNodeOptions();
    
    // Redraw truss
    drawTruss();
}

// Update node table
function updateNodeTable() {
    const nodeTable = document.querySelector('#node-table tbody');
    nodeTable.innerHTML = '';
    
    for (const nodeId in trussData.nodes) {
        const [x, y] = trussData.nodes[nodeId];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nodeId}</td>
            <td>${x}</td>
            <td>${y}</td>
            <td><button class="delete-btn" onclick="deleteNode('${nodeId}')">Delete</button></td>
        `;
        nodeTable.appendChild(row);
    }
}

// Update member table
function updateMemberTable() {
    const memberTable = document.querySelector('#member-table tbody');
    memberTable.innerHTML = '';
    
    trussData.members.forEach((member, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>M${i + 1}</td>
            <td>${member[0]}</td>
            <td>${member[1]}</td>
            <td><button class="delete-btn" onclick="deleteMember(${i})">Delete</button></td>
        `;
        memberTable.appendChild(row);
    });
}

// Update support table
function updateSupportTable() {
    const supportTable = document.querySelector('#support-table tbody');
    supportTable.innerHTML = '';
    
    for (const nodeId in trussData.supports) {
        const [fixedX, fixedY] = trussData.supports[nodeId];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nodeId}</td>
            <td>${fixedX ? 'Yes' : 'No'}</td>
            <td>${fixedY ? 'Yes' : 'No'}</td>
            <td><button class="delete-btn" onclick="deleteSupport('${nodeId}')">Delete</button></td>
        `;
        supportTable.appendChild(row);
    }
}

// Update load table
function updateLoadTable() {
    const loadTable = document.querySelector('#load-table tbody');
    loadTable.innerHTML = '';
    
    for (const nodeId in trussData.loads) {
        const [loadX, loadY] = trussData.loads[nodeId];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${nodeId}</td>
            <td>${loadX}</td>
            <td>${loadY}</td>
            <td><button class="delete-btn" onclick="deleteLoad('${nodeId}')">Delete</button></td>
        `;
        loadTable.appendChild(row);
    }
}

// Draw truss on canvas
function drawTruss() {
    const canvas = document.getElementById('truss-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Get bounds for scaling
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const nodeId in trussData.nodes) {
        const [x, y] = trussData.nodes[nodeId];
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    
    // Add padding
    minX -= 1;
    minY -= 1;
    maxX += 1;
    maxY += 1;
    
    // Calculate scale and offset
    const scaleX = (canvas.width - 40) / (maxX - minX);
    const scaleY = (canvas.height - 40) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (canvas.width - scale * (maxX - minX)) / 2 - scale * minX;
    const offsetY = (canvas.height - scale * (maxY - minY)) / 2 - scale * minY;
    
    // Transform coordinates
    function transformX(x) {
        return offsetX + scale * x;
    }
    
    function transformY(y) {
        return canvas.height - (offsetY + scale * y); // Flip Y-axis
    }
    
    // Draw members
    ctx.lineWidth = 2;
    
    for (const [i, member] of trussData.members.entries()) {
        const [nodeI, nodeJ] = member;
        const [xi, yi] = trussData.nodes[nodeI];
        const [xj, yj] = trussData.nodes[nodeJ];
        
        const x1 = transformX(xi);
        const y1 = transformY(yi);
        const x2 = transformX(xj);
        const y2 = transformY(yj);
        
        // Draw member
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        // Color based on results if available
        if (trussData.results && trussData.results.member_forces) {
            const force = trussData.results.member_forces[`${nodeI},${nodeJ}`];
            if (force > 0) {
                ctx.strokeStyle = '#e74c3c'; // Tension (red)
            } else if (force < 0) {
                ctx.strokeStyle = '#3498db'; // Compression (blue)
            } else {
                ctx.strokeStyle = '#95a5a6'; // Zero (gray)
            }
        } else {
            ctx.strokeStyle = '#2c3e50'; // Default
        }
        
        ctx.stroke();
        
        // Draw member label
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(midX, midY, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`M${i+1}`, midX, midY);
    }
    
    // Draw support symbols
    for (const nodeId in trussData.supports) {
        const [x, y] = trussData.nodes[nodeId];
        const supportX = transformX(x);
        const supportY = transformY(y);
        const [fixedX, fixedY] = trussData.supports[nodeId];
        
        ctx.fillStyle = '#27ae60';
        
        if (fixedX && fixedY) {
            // Fixed support (triangle)
            ctx.beginPath();
            ctx.moveTo(supportX, supportY + 10);
            ctx.lineTo(supportX - 10, supportY + 20);
            ctx.lineTo(supportX + 10, supportY + 20);
            ctx.closePath();
            ctx.fill();
        } else if (fixedY) {
            // Roller support (circle)
            ctx.beginPath();
            ctx.arc(supportX, supportY + 10, 8, 0, 2 * Math.PI);
            ctx.fill();
        } else if (fixedX) {
            // Horizontal support (horizontal line)
            ctx.beginPath();
            ctx.moveTo(supportX - 10, supportY);
            ctx.lineTo(supportX + 10, supportY);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#27ae60';
            ctx.stroke();
        }
    }
    
    // Draw load symbols
    for (const nodeId in trussData.loads) {
        const [x, y] = trussData.nodes[nodeId];
        const loadX = transformX(x);
        const loadY = transformY(y);
        const [forceX, forceY] = trussData.loads[nodeId];
        
        const arrowLength = 20;
        const arrowWidth = 5;
        
        ctx.strokeStyle = '#e74c3c';
        ctx.fillStyle = '#e74c3c';
        ctx.lineWidth = 2;
        
        if (forceX !== 0) {
            // Horizontal force
            const dirX = forceX > 0 ? 1 : -1;
            
            // Arrow line
            ctx.beginPath();
            ctx.moveTo(loadX, loadY);
            ctx.lineTo(loadX + dirX * arrowLength, loadY);
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(loadX + dirX * arrowLength, loadY);
            ctx.lineTo(loadX + dirX * (arrowLength - arrowWidth), loadY - arrowWidth);
            ctx.lineTo(loadX + dirX * (arrowLength - arrowWidth), loadY + arrowWidth);
            ctx.closePath();
            ctx.fill();
        }
        
        if (forceY !== 0) {
            // Vertical force
            const dirY = forceY > 0 ? 1 : -1;
            
            // Arrow line
            ctx.beginPath();
            ctx.moveTo(loadX, loadY);
            ctx.lineTo(loadX, loadY + dirY * arrowLength);
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(loadX, loadY + dirY * arrowLength);
            ctx.lineTo(loadX - arrowWidth, loadY + dirY * (arrowLength - arrowWidth));
            ctx.lineTo(loadX + arrowWidth, loadY + dirY * (arrowLength - arrowWidth));
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Draw nodes
    for (const nodeId in trussData.nodes) {
        const [x, y] = trussData.nodes[nodeId];
        const nodeX = transformX(x);
        const nodeY = transformY(y);
        
        // Draw node
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#3498db';
        ctx.fill();
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw node label
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nodeId, nodeX, nodeY);
    }
}