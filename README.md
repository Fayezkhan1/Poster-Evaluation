cd API
python -m venv .venv
.venv\Scripts\activate    
python.exe -m pip install --upgrade pip
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py

cd UI
npm install
npm run dev

git status
git add .
git commit -m "quick commit"
git push
