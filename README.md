cd "Back End"
python -m venv .venv
.venv\Scripts\activate    
python.exe -m pip install --upgrade pip
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py

cd "Front End"

git status
git add .
git commit -m "quick commit"
git push
