# Truss Analysis Web Application

## Overview
This project is a **Truss Analysis Web Application** that allows users to input truss structure data and analyze it using the **Direct Stiffness Method**. The application uses **Flask** as the backend, JavaScript for client-side interactions, and HTML/CSS for the UI.

## Files Included

### 1️⃣ **Backend - Flask (`app.py`)**
- A Flask web server that handles HTTP requests.
- Defines an API endpoint `/analyze` to process truss structure data.
- Uses **NumPy** for numerical computations.

### 2️⃣ **Frontend - HTML (`index.html`)** *(Not explicitly provided but assumed)*
- The main webpage where users input truss data.
- Includes buttons and forms for interaction.

### 3️⃣ **Styles - CSS (`style.css`)**
- Styles the user interface for a better visual experience.

### 4️⃣ **Client-side Logic - JavaScript (`script.js`)**
- Listens for button clicks to send requests to the Flask server.
- Uses Fetch API to communicate with the `/analyze` endpoint.
- Displays the analysis results on the page.

## How to Run Locally

### **1️⃣ Install Dependencies**
Ensure you have **Python 3** and **Flask** installed.
```sh
pip install flask numpy
```

### **2️⃣ Run the Flask Server**
```sh
python app.py
```
By default, the server runs on `http://127.0.0.1:5000/`.

### **3️⃣ Open the Web Application**
- Open `index.html` in a browser.
- Enter truss data and click **Analyze Trusses**.

## Deployment
To make your project accessible online, deploy it using **Render, Heroku, or PythonAnywhere**:

1. Create `requirements.txt`:
   ```sh
   pip freeze > requirements.txt
   ```
2. Create `Procfile`:
   ```sh
   web: gunicorn app:app
   ```
3. Push to GitHub and deploy using a hosting service.

## Possible Issues & Fixes
- **CORS Issues?** Add `Flask-CORS`:
  ```sh
  pip install flask-cors
  ```
  Modify `app.py`:
  ```python
  from flask_cors import CORS
  CORS(app)
  ```

- **Server Crashes?** Check the terminal logs for Python errors.
- **JavaScript Errors?** Open the browser console (F12 > Console) for details.

## Contributing
Feel free to improve this project by submitting **pull requests**!

## License
This project is **open-source** under the MIT License.

