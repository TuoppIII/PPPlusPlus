Welcome to Pirate Pastie++ 

Pirate Pastie++ is a tool for sharing content between different computers 
like you would use clipboard. The user can copy & paste content, including images, 
to Pirated Pastie++ web page, save "memo" and share the attached link to
others using IRC, mail, IM etc.

There are two parts in this software, namely front end for web browsers to
communicate with users and backend which serves web pages and 
REST api calls to save and fetch "memos".

Setting up server:
1. Fetch the repository to the server where you want to run Pirated Pastie++
2. Go to backend -directory and install dependencies with "npm install", ignore warnings
3. Check config file piratedpastie.config in backend -directory
4. Run server with npm start
5. Browse to Pirate Pastie++ start page, default is "http://localhost:30001/"
6. Enjoy!


Plans for unforeseen future:
1. Clean up based on DB size.
2. Full version history shown on every memo
3. Tooltip to Pirate Pastie -logo, which shows that logo jumps to
back to start page
4. Code highlight with images. Currently code highlight will strip
images from the code.

