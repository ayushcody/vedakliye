import sys

content = open(sys.argv[1]).read()
def count(content):
    o = content.count("<div")
    c = content.count("</div")
    print("divs: ", o, c)
    o2 = content.count("<span")
    c2 = content.count("</span")
    print("spans: ", o2, c2)

count(content)
