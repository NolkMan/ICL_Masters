import matplotlib.pyplot as plt
import numpy as np

INPUT_DIR = '../../node/run_logs'
OUTPUT_DIR = '../imgs'

files = {
    'caixabank': 'www.caixabank.es',
    'libertatea': 'www.libertatea.ro',
    'professormesser': 'www.professormesser.com',
    'quran': 'quran.com',
}

for f in files:
    with open(INPUT_DIR+'/'+f, 'r') as file:
        data = []
        for line in file:
            if line[0:6] == 'Total:':
                splits = line.strip().split('\t')
                try :
                    dpoint = float(splits[2][splits[2].index(':')+2:splits[2].index('%')])
                    if not np.isnan(dpoint):
                        data.append(dpoint*100.0)
                except :
                    pass
        x = np.linspace(0, 0.2*len(data), len(data))
        plt.plot(x, data, label=files[f]) 

plt.xlabel('Seconds')
plt.ylabel('Percentage of trafic dedicated to reports')

plt.legend(loc='center right')

plt.xlim(0, 36)

plt.savefig(OUTPUT_DIR + '/netword_usage_plot.png', dpi=200)



