# https://towardsai.net/p/l/detect-malicious-javascript-code-using-machine-learning
import os
import re
import math
import warnings
import numpy as np
import pandas as pd

from tqdm import tqdm
from collections import Counter
from sklearn import metrics
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score

warnings.filterwarnings('ignore')

SEED = 0
JS_DATA_DIR = "./JavascriptSamples" 
OBFUSCATED_JS_DATA_DIR = "./JavascriptSamplesObfuscated"



filenames, scripts, labels = [], [], []
file_types_and_labels = [(JS_DATA_DIR, 0), (OBFUSCATED_JS_DATA_DIR, 1)]

for files_path, label in file_types_and_labels:
    files = os.listdir(files_path)
    for file in tqdm(files):
        file_path = files_path + "/" + file
        try:
            with open(file_path, "r", encoding="utf8") as myfile:
                df = myfile.read().replace("\n", "")
                df = str(df)
                filenames.append(file)
                scripts.append(df)
                labels.append(label)
        except Exception as e:
            print(e)



df = pd.DataFrame(data=filenames, columns=['js_filename'])
df['js'] = scripts
df['label'] = labels

print(df.head())

# removing empty scripts
df = df[df['js'] != '']

# removing duplicates
df = df[~df["js"].isin(df["js"][df["js"].duplicated()])]

# Some obfuscated scripts I found in the legitimate JS samples folder, so let's change it label to 1
df["label"][df["js_filename"].apply(lambda x: True if 'obfuscated' in x else False)] = 1

df['js_length'] = df.js.apply(lambda x: len(x))
df['num_spaces'] = df.js.apply(lambda x: x.count(' '))

df['num_parenthesis'] = df.js.apply(lambda x: (x.count('(') + x.count(')')))
df['num_slash'] = df.js.apply(lambda x: x.count('/'))
df['num_plus'] = df.js.apply(lambda x: x.count('+'))
df['num_point'] = df.js.apply(lambda x: x.count('.'))
df['num_comma'] = df.js.apply(lambda x: x.count(','))
df['num_semicolon'] = df.js.apply(lambda x: x.count(';'))
df['num_alpha'] = df.js.apply(lambda x: len(re.findall(re.compile(r"\w"),x)))
df['num_numeric'] = df.js.apply(lambda x: len(re.findall(re.compile(r"[0-9]"),x)))

df['ratio_spaces'] = df['num_spaces'] / df['js_length']
df['ratio_alpha'] = df['num_alpha'] / df['js_length']
df['ratio_numeric'] = df['num_numeric'] / df['js_length']
df['ratio_parenthesis'] = df['num_parenthesis'] / df['js_length']
df['ratio_slash'] = df['num_slash'] / df['js_length']
df['ratio_plus'] = df['num_plus'] / df['js_length']
df['ratio_point'] = df['num_point'] / df['js_length']
df['ratio_comma'] = df['num_comma'] / df['js_length']
df['ratio_semicolon'] = df['num_semicolon'] / df['js_length']

def entropy(s):
    p, lns = Counter(s), float(len(s))
    return -sum( count/lns * math.log(count/lns, 2) for count in p.values())

df['entropy'] = df.js.apply(lambda x: entropy(x))

# Encoding Operation: escape(), unescape(), string(), fromCharCode()

df['num_encoding_oper'] = df.js.apply(lambda x: x.count('escape') +
                                        x.count('unescape') +
                                        x.count('string') +
                                        x.count('fromCharCode'))

df['ratio_num_encoding_oper'] = df['num_encoding_oper'] / df['js_length']

# URL Redirection: setTimeout(), location.reload(), location.replace(), document.URL(), document.location(), document.referrer()

df['num_url_redirection'] = df.js.apply(lambda x: x.count('setTimeout') +
                                          x.count('location.reload') +
                                          x.count('location.replace') +
                                          x.count('document.URL') +
                                          x.count('document.location') +
                                          x.count('document.referrer'))

df['ratio_num_url_redirection'] = df['num_url_redirection'] / df['js_length']

# Specific Behaviors: eval(), setTime(), setInterval(), ActiveXObject(), createElement(), document.write(), document.writeln(), document.replaceChildren()

df['num_specific_func'] = df.js.apply(lambda x: x.count('eval') +
                                       x.count('setTime') +
                                       x.count('setInterval') +
                                       x.count('ActiveXObject') +
                                       x.count('createElement') +
                                       x.count('document.write') +
                                       x.count('document.writeln') +
                                       x.count('document.replaceChildren'))

df['ratio_num_specific_func'] = df['num_specific_func'] / df['js_length']

print("Mean entropy for obfuscated js:", df['entropy'][df["label"] == 1].mean())
print("Mean entropy for non-obfuscated js:", df['entropy'][df["label"] == 0].mean())
print("Mean encoding operations for obfuscated js:", df['num_encoding_oper'][df["label"] == 1].mean())
print("Mean encoding operations for non-obfuscated js:", df['num_encoding_oper'][df["label"] == 0].mean())
print("Mean URL redirections for obfuscated js:", df['num_url_redirection'][df["label"] == 1].mean())
print("Mean URL redirections for non-obfuscated js:", df['num_url_redirection'][df["label"] == 0].mean())
print("Mean specific functions for obfuscated js:", df['num_specific_func'][df["label"] == 1].mean())
print("Mean specific functions for non-obfuscated js:", df['num_specific_func'][df["label"] == 0].mean())

X_train, X_test, y_train, y_test = train_test_split(df.iloc[:, 3:], df['label'],
                                                    stratify=df['label'], 
                                                    test_size=0.2,
                                                    random_state=SEED)

print(X_test.columns)


clf = RandomForestClassifier(n_estimators=100, random_state=SEED)

# 5-Fold Cross validation
print("Mean accuracy over 5 folds:", np.mean(cross_val_score(clf, X_train, y_train, cv=5)))

clf=RandomForestClassifier(n_estimators=100, random_state=SEED)
clf.fit(X_train, y_train)
y_pred=clf.predict(X_test)

print("Accuracy:",metrics.accuracy_score(y_test, y_pred))

conf_mat = metrics.confusion_matrix(y_test, y_pred)

print(metrics.classification_report(y_test,
                                    y_pred,
                                    target_names=['non-obfuscted', 'obfuscated']))

def predict_obfuscated(js):
    test_df = pd.DataFrame(data=['web_test'], columns=['js_filename'])
    test_df['js'] = [js]
    test_df['label'] = [True]

    print(test_df.head())

    test_df['js_length'] = test_df.js.apply(lambda x: len(x))
    test_df['num_spaces'] = test_df.js.apply(lambda x: x.count(' '))
    test_df['num_parenthesis'] = test_df.js.apply(lambda x: (x.count('(') + x.count(')')))
    test_df['num_slash'] = test_df.js.apply(lambda x: x.count('/'))
    test_df['num_plus'] = test_df.js.apply(lambda x: x.count('+'))
    test_df['num_point'] = test_df.js.apply(lambda x: x.count('.'))
    test_df['num_comma'] = test_df.js.apply(lambda x: x.count(','))
    test_df['num_semicolon'] = test_df.js.apply(lambda x: x.count(';'))
    test_df['num_alpha'] = test_df.js.apply(lambda x: len(re.findall(re.compile(r"\w"),x)))
    test_df['num_numeric'] = test_df.js.apply(lambda x: len(re.findall(re.compile(r"[0-9]"),x)))
    test_df['ratio_spaces'] = test_df['num_spaces'] / test_df['js_length']
    test_df['ratio_alpha'] = test_df['num_alpha'] / test_df['js_length']
    test_df['ratio_numeric'] = test_df['num_numeric'] / test_df['js_length']
    test_df['ratio_parenthesis'] = test_df['num_parenthesis'] / test_df['js_length']
    test_df['ratio_slash'] = test_df['num_slash'] / test_df['js_length']
    test_df['ratio_plus'] = test_df['num_plus'] / test_df['js_length']
    test_df['ratio_point'] = test_df['num_point'] / test_df['js_length']
    test_df['ratio_comma'] = test_df['num_comma'] / test_df['js_length']
    test_df['ratio_semicolon'] = test_df['num_semicolon'] / test_df['js_length']
    test_df['entropy'] = test_df.js.apply(lambda x: entropy(x))
    test_df['num_encoding_oper'] = test_df.js.apply(lambda x: x.count('escape') +
                                            x.count('unescape') +
                                            x.count('string') +
                                            x.count('fromCharCode'))
    test_df['ratio_num_encoding_oper'] = test_df['num_encoding_oper'] / test_df['js_length']
    test_df['num_url_redirection'] = test_df.js.apply(lambda x: x.count('setTimeout') +
                                              x.count('location.reload') +
                                              x.count('location.replace') +
                                              x.count('document.URL') +
                                              x.count('document.location') +
                                              x.count('document.referrer'))
    test_df['ratio_num_url_redirection'] = test_df['num_url_redirection'] / test_df['js_length']
    test_df['num_specific_func'] = test_df.js.apply(lambda x: x.count('eval') +
                                           x.count('setTime') +
                                           x.count('setInterval') +
                                           x.count('ActiveXObject') +
                                           x.count('createElement') +
                                           x.count('document.write') +
                                           x.count('document.writeln') +
                                           x.count('document.replaceChildren'))
    test_df['ratio_num_specific_func'] = test_df['num_specific_func'] / test_df['js_length']

    ready_df = test_df.iloc[:, 3:]
    print(ready_df.head())
    print(ready_df.columns)
    live_pred=clf.predict(ready_df)
    print(live_pred[0])
    return (True if live_pred[0] == 1 else False)

