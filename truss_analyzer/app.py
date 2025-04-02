import numpy as np
from flask import Flask, request, jsonify, render_template

app = Flask(__name__, static_folder='static', template_folder='templates')

def analyze_truss(nodes, members, supports, loads):
    """
    Analyze a 2D truss structure using the direct stiffness method
    
    Parameters:
    nodes: dict - Node coordinates {node_id: [x, y]}
    members: list - Member connections [(node_i, node_j)]
    supports: dict - Support conditions {node_id: [x_fixed(bool), y_fixed(bool)]}
    loads: dict - Applied loads {node_id: [Fx, Fy]}
    
    Returns:
    dict - Member forces and nodal displacements
    """
    # Count degrees of freedom and create mapping
    n_nodes = len(nodes)
    n_dofs = 2 * n_nodes  # 2 DOFs per node (x and y)
    
    # Create DOF mapping for each node
    dof_map = {}
    for i, node_id in enumerate(nodes.keys()):
        dof_map[node_id] = [2*i, 2*i+1]  # x and y DOFs
    
    # Initialize global stiffness matrix
    K = np.zeros((n_dofs, n_dofs))
    
    # Assemble global stiffness matrix
    for member in members:
        node_i, node_j = member
        
        # Get node coordinates
        xi, yi = nodes[node_i]
        xj, yj = nodes[node_j]
        
        # Calculate member length and orientation
        dx = xj - xi
        dy = yj - yi
        L = np.sqrt(dx**2 + dy**2)
        
        # Direction cosines
        c = dx/L  # cosine
        s = dy/L  # sine
        
        # Member stiffness in local coordinates (assuming EA/L = 1 for simplicity)
        # This can be modified to include actual material properties
        EA_L = 1.0  # Normalized stiffness (EA/L)
        
        # Transformation matrix
        T = np.array([
            [c, s, 0, 0],
            [0, 0, c, s]
        ])
        
        # Member stiffness in local coordinates
        k_local = EA_L * np.array([
            [1, -1],
            [-1, 1]
        ])
        
        # Transform to global coordinates
        T_transpose = T.transpose()
        k_global = T_transpose @ k_local @ T
        
        # Get DOF indices
        dofs_i = dof_map[node_i]
        dofs_j = dof_map[node_j]
        dofs = dofs_i + dofs_j
        
        # Assemble into global stiffness matrix
        for p in range(4):
            for q in range(4):
                K[dofs[p], dofs[q]] += k_global[p, q]
    
    # Create load vector
    F = np.zeros(n_dofs)
    for node_id, load in loads.items():
        dofs = dof_map[node_id]
        F[dofs[0]] += load[0]  # Fx
        F[dofs[1]] += load[1]  # Fy
    
    # Apply boundary conditions
    free_dofs = []
    fixed_dofs = []
    
    for node_id, constraint in supports.items():
        dofs = dof_map[node_id]
        if constraint[0]:  # x fixed
            fixed_dofs.append(dofs[0])
        else:
            free_dofs.append(dofs[0])
        
        if constraint[1]:  # y fixed
            fixed_dofs.append(dofs[1])
        else:
            free_dofs.append(dofs[1])
    
    # Solve for displacements (only for free DOFs)
    K_free = K[np.ix_(free_dofs, free_dofs)]
    F_free = F[free_dofs]
    
    # Solve the system of equations
    u_free = np.linalg.solve(K_free, F_free)
    
    # Construct full displacement vector
    u = np.zeros(n_dofs)
    for i, dof in enumerate(free_dofs):
        u[dof] = u_free[i]
    
    # Calculate member forces
    member_forces = {}
    for i, member in enumerate(members):
        node_i, node_j = member
        
        # Get node coordinates
        xi, yi = nodes[node_i]
        xj, yj = nodes[node_j]
        
        # Calculate member length and orientation
        dx = xj - xi
        dy = yj - yi
        L = np.sqrt(dx**2 + dy**2)
        
        # Direction cosines
        c = dx/L
        s = dy/L
        
        # Get displacements for this member
        dofs_i = dof_map[node_i]
        dofs_j = dof_map[node_j]
        u_i = u[dofs_i]
        u_j = u[dofs_j]
        
        # Calculate elongation in member direction
        delta = c * (u_j[0] - u_i[0]) + s * (u_j[1] - u_i[1])
        
        # Calculate axial force (positive = tension, negative = compression)
        # Using normalized stiffness (EA/L = 1)
        force = delta * EA_L
        
        member_forces[(node_i, node_j)] = force
    
    # Return results
    displacements = {}
    for node_id in nodes:
        dofs = dof_map[node_id]
        displacements[node_id] = [u[dofs[0]], u[dofs[1]]]
    
    return {
        "member_forces": member_forces,
        "displacements": displacements
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    
    # Extract truss data
    nodes = data['nodes']
    members = data['members']
    supports = data['supports']
    loads = data['loads']
    
    # Analyze truss
    results = analyze_truss(nodes, members, supports, loads)
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)