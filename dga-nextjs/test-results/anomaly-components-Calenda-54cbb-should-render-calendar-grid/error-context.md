# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: anomaly-components.spec.ts >> CalendarHeatmap (History Page) >> should render calendar grid
- Location: tests/anomaly-components.spec.ts:70:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 30
Received:   0
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - heading "Anomaly History" [level=1] [ref=e5]
        - paragraph [ref=e6]: Review past anomaly events with noise filtering
      - button "← Back to Dashboard" [ref=e7] [cursor=pointer]
    - generic [ref=e8]:
      - generic [ref=e9]: Noise Filter
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: Devices (comma-separated)
          - textbox "DA115,DA08,..." [ref=e13]
        - generic [ref=e14]:
          - generic [ref=e15]: Start Date
          - textbox [ref=e16]
        - generic [ref=e17]:
          - generic [ref=e18]: End Date
          - textbox [ref=e19]
        - generic [ref=e20]:
          - generic [ref=e21]: Min Z-Score
          - spinbutton [ref=e22]: "3.5"
        - generic [ref=e23]:
          - generic [ref=e24]: Min Duration (min)
          - spinbutton [ref=e25]: "30"
        - generic [ref=e26]:
          - generic [ref=e27]: Severity
          - combobox [ref=e28]:
            - option "All" [selected]
            - option "Warning"
            - option "Critical"
    - generic [ref=e29]:
      - generic [ref=e30]:
        - button "←" [ref=e31] [cursor=pointer]
        - heading "July 2026" [level=3] [ref=e32]
        - button "→" [ref=e33] [cursor=pointer]
      - generic [ref=e34]:
        - generic [ref=e35]: No events
        - text: Warning
        - text: Critical
      - generic [ref=e38]:
        - generic [ref=e39]: Sun
        - generic [ref=e40]: Mon
        - generic [ref=e41]: Tue
        - generic [ref=e42]: Wed
        - generic [ref=e43]: Thu
        - generic [ref=e44]: Fri
        - generic [ref=e45]: Sat
      - generic [ref=e46]:
        - generic "No events" [ref=e50] [cursor=pointer]:
          - generic [ref=e51]: "1"
        - generic "1 events (warning)" [ref=e52] [cursor=pointer]:
          - generic [ref=e53]: "2"
          - generic [ref=e54]: "1"
        - generic "5 events (critical)" [ref=e55] [cursor=pointer]:
          - generic [ref=e56]: "3"
          - generic [ref=e57]: "5"
        - generic "2 events (warning)" [ref=e58] [cursor=pointer]:
          - generic [ref=e59]: "4"
          - generic [ref=e60]: "2"
        - generic "No events" [ref=e61] [cursor=pointer]:
          - generic [ref=e62]: "5"
        - generic "2 events (warning)" [ref=e63] [cursor=pointer]:
          - generic [ref=e64]: "6"
          - generic [ref=e65]: "2"
        - generic "5 events (critical)" [ref=e66] [cursor=pointer]:
          - generic [ref=e67]: "7"
          - generic [ref=e68]: "5"
        - generic "3 events (critical)" [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: "8"
          - generic [ref=e71]: "3"
        - generic "3 events (warning)" [ref=e72] [cursor=pointer]:
          - generic [ref=e73]: "9"
          - generic [ref=e74]: "3"
        - generic "2 events (warning)" [ref=e75] [cursor=pointer]:
          - generic [ref=e76]: "10"
          - generic [ref=e77]: "2"
        - generic "5 events (critical)" [ref=e78] [cursor=pointer]:
          - generic [ref=e79]: "11"
          - generic [ref=e80]: "5"
        - generic "3 events (critical)" [ref=e81] [cursor=pointer]:
          - generic [ref=e82]: "12"
          - generic [ref=e83]: "3"
        - generic "3 events (critical)" [ref=e84] [cursor=pointer]:
          - generic [ref=e85]: "13"
          - generic [ref=e86]: "3"
        - generic "No events" [ref=e87] [cursor=pointer]:
          - generic [ref=e88]: "14"
        - generic "No events" [ref=e89] [cursor=pointer]:
          - generic [ref=e90]: "15"
        - generic "5 events (warning)" [ref=e91] [cursor=pointer]:
          - generic [ref=e92]: "16"
          - generic [ref=e93]: "5"
        - generic "1 events (warning)" [ref=e94] [cursor=pointer]:
          - generic [ref=e95]: "17"
          - generic [ref=e96]: "1"
        - generic "1 events (warning)" [ref=e97] [cursor=pointer]:
          - generic [ref=e98]: "18"
          - generic [ref=e99]: "1"
        - generic "5 events (critical)" [ref=e100] [cursor=pointer]:
          - generic [ref=e101]: "19"
          - generic [ref=e102]: "5"
        - generic "1 events (warning)" [ref=e103] [cursor=pointer]:
          - generic [ref=e104]: "20"
          - generic [ref=e105]: "1"
        - generic "5 events (critical)" [ref=e106] [cursor=pointer]:
          - generic [ref=e107]: "21"
          - generic [ref=e108]: "5"
        - generic "2 events (warning)" [ref=e109] [cursor=pointer]:
          - generic [ref=e110]: "22"
          - generic [ref=e111]: "2"
        - generic "No events" [ref=e112] [cursor=pointer]:
          - generic [ref=e113]: "23"
        - generic "3 events (warning)" [ref=e114] [cursor=pointer]:
          - generic [ref=e115]: "24"
          - generic [ref=e116]: "3"
        - generic "1 events (warning)" [ref=e117] [cursor=pointer]:
          - generic [ref=e118]: "25"
          - generic [ref=e119]: "1"
        - generic "5 events (critical)" [ref=e120] [cursor=pointer]:
          - generic [ref=e121]: "26"
          - generic [ref=e122]: "5"
        - generic "1 events (warning)" [ref=e123] [cursor=pointer]:
          - generic [ref=e124]: "27"
          - generic [ref=e125]: "1"
        - generic "No events" [ref=e126] [cursor=pointer]:
          - generic [ref=e127]: "28"
        - generic "1 events (warning)" [ref=e128] [cursor=pointer]:
          - generic [ref=e129]: "29"
          - generic [ref=e130]: "1"
        - generic "2 events (warning)" [ref=e131] [cursor=pointer]:
          - generic [ref=e132]: "30"
          - generic [ref=e133]: "2"
        - generic "4 events (warning)" [ref=e134] [cursor=pointer]:
          - generic [ref=e135]: "31"
          - generic [ref=e136]: "4"
    - generic [ref=e137]:
      - generic [ref=e138]: Showing 50 of 72 events (page 1/2)
      - generic [ref=e139]:
        - button "Export CSV" [ref=e140] [cursor=pointer]:
          - img [ref=e141]
          - text: Export CSV
        - button "PDF Report" [ref=e144] [cursor=pointer]:
          - img [ref=e145]
          - text: PDF Report
    - generic [ref=e148]:
      - table [ref=e149]:
        - rowgroup [ref=e150]:
          - row "Time Device Gas Z-Score Duration Status" [ref=e151]:
            - columnheader "Time" [ref=e152]
            - columnheader "Device" [ref=e153]
            - columnheader "Gas" [ref=e154]
            - columnheader "Z-Score" [ref=e155]
            - columnheader "Duration" [ref=e156]
            - columnheader "Status" [ref=e157]
        - rowgroup [ref=e158]:
          - row "7/14/2026, 3:10:06 AM DA115 CO 5.29σ 45m (8 readings) critical" [ref=e159]:
            - cell "7/14/2026, 3:10:06 AM" [ref=e160]
            - cell "DA115" [ref=e161]
            - cell "CO" [ref=e162]
            - cell "5.29σ" [ref=e163]
            - cell "45m (8 readings)" [ref=e164]
            - cell "critical" [ref=e165]:
              - generic [ref=e166]: critical
          - row "7/14/2026, 2:10:06 AM DA115 CO 3.95σ 36m (6 readings) warning" [ref=e167]:
            - cell "7/14/2026, 2:10:06 AM" [ref=e168]
            - cell "DA115" [ref=e169]
            - cell "CO" [ref=e170]
            - cell "3.95σ" [ref=e171]
            - cell "36m (6 readings)" [ref=e172]
            - cell "warning" [ref=e173]:
              - generic [ref=e174]: warning
          - row "7/13/2026, 12:10:06 PM DA115 WC 5.06σ 54m (8 readings) critical" [ref=e175]:
            - cell "7/13/2026, 12:10:06 PM" [ref=e176]
            - cell "DA115" [ref=e177]
            - cell "WC" [ref=e178]
            - cell "5.06σ" [ref=e179]
            - cell "54m (8 readings)" [ref=e180]
            - cell "critical" [ref=e181]:
              - generic [ref=e182]: critical
          - row "7/13/2026, 4:10:06 AM DA115 H2 3.61σ 84m (6 readings) warning" [ref=e183]:
            - cell "7/13/2026, 4:10:06 AM" [ref=e184]
            - cell "DA115" [ref=e185]
            - cell "H2" [ref=e186]
            - cell "3.61σ" [ref=e187]
            - cell "84m (6 readings)" [ref=e188]
            - cell "warning" [ref=e189]:
              - generic [ref=e190]: warning
          - row "7/12/2026, 10:10:06 AM DA115 CO 4.46σ 62m (8 readings) critical" [ref=e191]:
            - cell "7/12/2026, 10:10:06 AM" [ref=e192]
            - cell "DA115" [ref=e193]
            - cell "CO" [ref=e194]
            - cell "4.46σ" [ref=e195]
            - cell "62m (8 readings)" [ref=e196]
            - cell "critical" [ref=e197]:
              - generic [ref=e198]: critical
          - row "7/12/2026, 2:10:06 AM DA115 H2 4.37σ 65m (8 readings) critical" [ref=e199]:
            - cell "7/12/2026, 2:10:06 AM" [ref=e200]
            - cell "DA115" [ref=e201]
            - cell "H2" [ref=e202]
            - cell "4.37σ" [ref=e203]
            - cell "65m (8 readings)" [ref=e204]
            - cell "critical" [ref=e205]:
              - generic [ref=e206]: critical
          - row "7/11/2026, 7:10:06 PM DA115 H2 5.22σ 47m (8 readings) critical" [ref=e207]:
            - cell "7/11/2026, 7:10:06 PM" [ref=e208]
            - cell "DA115" [ref=e209]
            - cell "H2" [ref=e210]
            - cell "5.22σ" [ref=e211]
            - cell "47m (8 readings)" [ref=e212]
            - cell "critical" [ref=e213]:
              - generic [ref=e214]: critical
          - row "7/11/2026, 5:10:06 PM DA115 WC 4.59σ 54m (8 readings) critical" [ref=e215]:
            - cell "7/11/2026, 5:10:06 PM" [ref=e216]
            - cell "DA115" [ref=e217]
            - cell "WC" [ref=e218]
            - cell "4.59σ" [ref=e219]
            - cell "54m (8 readings)" [ref=e220]
            - cell "critical" [ref=e221]:
              - generic [ref=e222]: critical
          - row "7/11/2026, 11:10:06 AM DA115 H2 4.69σ 86m (4 readings) critical" [ref=e223]:
            - cell "7/11/2026, 11:10:06 AM" [ref=e224]
            - cell "DA115" [ref=e225]
            - cell "H2" [ref=e226]
            - cell "4.69σ" [ref=e227]
            - cell "86m (4 readings)" [ref=e228]
            - cell "critical" [ref=e229]:
              - generic [ref=e230]: critical
          - row "7/10/2026, 10:10:06 PM DA115 WC 4.94σ 52m (8 readings) critical" [ref=e231]:
            - cell "7/10/2026, 10:10:06 PM" [ref=e232]
            - cell "DA115" [ref=e233]
            - cell "WC" [ref=e234]
            - cell "4.94σ" [ref=e235]
            - cell "52m (8 readings)" [ref=e236]
            - cell "critical" [ref=e237]:
              - generic [ref=e238]: critical
          - row "7/10/2026, 2:10:06 PM DA115 CO 4.96σ 49m (6 readings) critical" [ref=e239]:
            - cell "7/10/2026, 2:10:06 PM" [ref=e240]
            - cell "DA115" [ref=e241]
            - cell "CO" [ref=e242]
            - cell "4.96σ" [ref=e243]
            - cell "49m (6 readings)" [ref=e244]
            - cell "critical" [ref=e245]:
              - generic [ref=e246]: critical
          - row "7/10/2026, 9:10:06 AM DA115 CO 4.06σ 65m (5 readings) critical" [ref=e247]:
            - cell "7/10/2026, 9:10:06 AM" [ref=e248]
            - cell "DA115" [ref=e249]
            - cell "CO" [ref=e250]
            - cell "4.06σ" [ref=e251]
            - cell "65m (5 readings)" [ref=e252]
            - cell "critical" [ref=e253]:
              - generic [ref=e254]: critical
          - row "7/10/2026, 12:10:06 AM DA115 WC 4.23σ 52m (5 readings) critical" [ref=e255]:
            - cell "7/10/2026, 12:10:06 AM" [ref=e256]
            - cell "DA115" [ref=e257]
            - cell "WC" [ref=e258]
            - cell "4.23σ" [ref=e259]
            - cell "52m (5 readings)" [ref=e260]
            - cell "critical" [ref=e261]:
              - generic [ref=e262]: critical
          - row "7/9/2026, 10:10:06 AM DA115 H2 4.14σ 66m (5 readings) critical" [ref=e263]:
            - cell "7/9/2026, 10:10:06 AM" [ref=e264]
            - cell "DA115" [ref=e265]
            - cell "H2" [ref=e266]
            - cell "4.14σ" [ref=e267]
            - cell "66m (5 readings)" [ref=e268]
            - cell "critical" [ref=e269]:
              - generic [ref=e270]: critical
          - row "7/8/2026, 9:10:06 PM DA115 CO 5.45σ 77m (6 readings) critical" [ref=e271]:
            - cell "7/8/2026, 9:10:06 PM" [ref=e272]
            - cell "DA115" [ref=e273]
            - cell "CO" [ref=e274]
            - cell "5.45σ" [ref=e275]
            - cell "77m (6 readings)" [ref=e276]
            - cell "critical" [ref=e277]:
              - generic [ref=e278]: critical
          - row "7/8/2026, 7:10:06 PM DA115 CO 4.96σ 68m (6 readings) critical" [ref=e279]:
            - cell "7/8/2026, 7:10:06 PM" [ref=e280]
            - cell "DA115" [ref=e281]
            - cell "CO" [ref=e282]
            - cell "4.96σ" [ref=e283]
            - cell "68m (6 readings)" [ref=e284]
            - cell "critical" [ref=e285]:
              - generic [ref=e286]: critical
          - row "7/7/2026, 8:10:06 PM DA115 H2 4.62σ 70m (3 readings) critical" [ref=e287]:
            - cell "7/7/2026, 8:10:06 PM" [ref=e288]
            - cell "DA115" [ref=e289]
            - cell "H2" [ref=e290]
            - cell "4.62σ" [ref=e291]
            - cell "70m (3 readings)" [ref=e292]
            - cell "critical" [ref=e293]:
              - generic [ref=e294]: critical
          - row "7/7/2026, 3:10:06 PM DA115 WC 5.05σ 44m (7 readings) critical" [ref=e295]:
            - cell "7/7/2026, 3:10:06 PM" [ref=e296]
            - cell "DA115" [ref=e297]
            - cell "WC" [ref=e298]
            - cell "5.05σ" [ref=e299]
            - cell "44m (7 readings)" [ref=e300]
            - cell "critical" [ref=e301]:
              - generic [ref=e302]: critical
          - row "7/7/2026, 12:10:06 PM DA115 CO 5.25σ 61m (7 readings) critical" [ref=e303]:
            - cell "7/7/2026, 12:10:06 PM" [ref=e304]
            - cell "DA115" [ref=e305]
            - cell "CO" [ref=e306]
            - cell "5.25σ" [ref=e307]
            - cell "61m (7 readings)" [ref=e308]
            - cell "critical" [ref=e309]:
              - generic [ref=e310]: critical
          - row "7/6/2026, 5:10:06 PM DA115 H2 3.83σ 60m (5 readings) warning" [ref=e311]:
            - cell "7/6/2026, 5:10:06 PM" [ref=e312]
            - cell "DA115" [ref=e313]
            - cell "H2" [ref=e314]
            - cell "3.83σ" [ref=e315]
            - cell "60m (5 readings)" [ref=e316]
            - cell "warning" [ref=e317]:
              - generic [ref=e318]: warning
          - row "7/6/2026, 4:10:06 PM DA115 CO 4.50σ 87m (5 readings) critical" [ref=e319]:
            - cell "7/6/2026, 4:10:06 PM" [ref=e320]
            - cell "DA115" [ref=e321]
            - cell "CO" [ref=e322]
            - cell "4.50σ" [ref=e323]
            - cell "87m (5 readings)" [ref=e324]
            - cell "critical" [ref=e325]:
              - generic [ref=e326]: critical
          - row "7/6/2026, 3:10:06 PM DA115 WC 4.96σ 80m (4 readings) critical" [ref=e327]:
            - cell "7/6/2026, 3:10:06 PM" [ref=e328]
            - cell "DA115" [ref=e329]
            - cell "WC" [ref=e330]
            - cell "4.96σ" [ref=e331]
            - cell "80m (4 readings)" [ref=e332]
            - cell "critical" [ref=e333]:
              - generic [ref=e334]: critical
          - row "7/6/2026, 8:10:06 AM DA115 WC 5.46σ 78m (4 readings) critical" [ref=e335]:
            - cell "7/6/2026, 8:10:06 AM" [ref=e336]
            - cell "DA115" [ref=e337]
            - cell "WC" [ref=e338]
            - cell "5.46σ" [ref=e339]
            - cell "78m (4 readings)" [ref=e340]
            - cell "critical" [ref=e341]:
              - generic [ref=e342]: critical
          - row "7/6/2026, 2:10:06 AM DA115 H2 4.23σ 90m (8 readings) critical" [ref=e343]:
            - cell "7/6/2026, 2:10:06 AM" [ref=e344]
            - cell "DA115" [ref=e345]
            - cell "H2" [ref=e346]
            - cell "4.23σ" [ref=e347]
            - cell "90m (8 readings)" [ref=e348]
            - cell "critical" [ref=e349]:
              - generic [ref=e350]: critical
          - row "7/5/2026, 8:10:06 AM DA115 H2 3.96σ 69m (8 readings) warning" [ref=e351]:
            - cell "7/5/2026, 8:10:06 AM" [ref=e352]
            - cell "DA115" [ref=e353]
            - cell "H2" [ref=e354]
            - cell "3.96σ" [ref=e355]
            - cell "69m (8 readings)" [ref=e356]
            - cell "warning" [ref=e357]:
              - generic [ref=e358]: warning
          - row "7/4/2026, 12:10:06 PM DA115 CO 4.39σ 77m (5 readings) critical" [ref=e359]:
            - cell "7/4/2026, 12:10:06 PM" [ref=e360]
            - cell "DA115" [ref=e361]
            - cell "CO" [ref=e362]
            - cell "4.39σ" [ref=e363]
            - cell "77m (5 readings)" [ref=e364]
            - cell "critical" [ref=e365]:
              - generic [ref=e366]: critical
          - row "7/4/2026, 6:10:06 AM DA115 H2 5.29σ 51m (6 readings) critical" [ref=e367]:
            - cell "7/4/2026, 6:10:06 AM" [ref=e368]
            - cell "DA115" [ref=e369]
            - cell "H2" [ref=e370]
            - cell "5.29σ" [ref=e371]
            - cell "51m (6 readings)" [ref=e372]
            - cell "critical" [ref=e373]:
              - generic [ref=e374]: critical
          - row "7/3/2026, 1:10:06 AM DA115 CO 5.31σ 83m (5 readings) critical" [ref=e375]:
            - cell "7/3/2026, 1:10:06 AM" [ref=e376]
            - cell "DA115" [ref=e377]
            - cell "CO" [ref=e378]
            - cell "5.31σ" [ref=e379]
            - cell "83m (5 readings)" [ref=e380]
            - cell "critical" [ref=e381]:
              - generic [ref=e382]: critical
          - row "7/2/2026, 7:10:06 AM DA115 CO 3.73σ 43m (8 readings) warning" [ref=e383]:
            - cell "7/2/2026, 7:10:06 AM" [ref=e384]
            - cell "DA115" [ref=e385]
            - cell "CO" [ref=e386]
            - cell "3.73σ" [ref=e387]
            - cell "43m (8 readings)" [ref=e388]
            - cell "warning" [ref=e389]:
              - generic [ref=e390]: warning
          - row "7/2/2026, 5:10:06 AM DA115 CO 4.77σ 31m (5 readings) critical" [ref=e391]:
            - cell "7/2/2026, 5:10:06 AM" [ref=e392]
            - cell "DA115" [ref=e393]
            - cell "CO" [ref=e394]
            - cell "4.77σ" [ref=e395]
            - cell "31m (5 readings)" [ref=e396]
            - cell "critical" [ref=e397]:
              - generic [ref=e398]: critical
          - row "7/1/2026, 11:10:06 PM DA115 H2 4.07σ 64m (4 readings) critical" [ref=e399]:
            - cell "7/1/2026, 11:10:06 PM" [ref=e400]
            - cell "DA115" [ref=e401]
            - cell "H2" [ref=e402]
            - cell "4.07σ" [ref=e403]
            - cell "64m (4 readings)" [ref=e404]
            - cell "critical" [ref=e405]:
              - generic [ref=e406]: critical
          - row "6/30/2026, 11:10:06 PM DA115 WC 5.19σ 58m (8 readings) critical" [ref=e407]:
            - cell "6/30/2026, 11:10:06 PM" [ref=e408]
            - cell "DA115" [ref=e409]
            - cell "WC" [ref=e410]
            - cell "5.19σ" [ref=e411]
            - cell "58m (8 readings)" [ref=e412]
            - cell "critical" [ref=e413]:
              - generic [ref=e414]: critical
          - row "6/30/2026, 8:10:06 PM DA115 WC 4.55σ 44m (8 readings) critical" [ref=e415]:
            - cell "6/30/2026, 8:10:06 PM" [ref=e416]
            - cell "DA115" [ref=e417]
            - cell "WC" [ref=e418]
            - cell "4.55σ" [ref=e419]
            - cell "44m (8 readings)" [ref=e420]
            - cell "critical" [ref=e421]:
              - generic [ref=e422]: critical
          - row "6/30/2026, 7:10:06 PM DA115 WC 4.97σ 57m (3 readings) critical" [ref=e423]:
            - cell "6/30/2026, 7:10:06 PM" [ref=e424]
            - cell "DA115" [ref=e425]
            - cell "WC" [ref=e426]
            - cell "4.97σ" [ref=e427]
            - cell "57m (3 readings)" [ref=e428]
            - cell "critical" [ref=e429]:
              - generic [ref=e430]: critical
          - row "6/30/2026, 1:10:06 PM DA115 H2 4.98σ 72m (7 readings) critical" [ref=e431]:
            - cell "6/30/2026, 1:10:06 PM" [ref=e432]
            - cell "DA115" [ref=e433]
            - cell "H2" [ref=e434]
            - cell "4.98σ" [ref=e435]
            - cell "72m (7 readings)" [ref=e436]
            - cell "critical" [ref=e437]:
              - generic [ref=e438]: critical
          - row "6/30/2026, 10:10:06 AM DA115 CO 4.83σ 69m (6 readings) critical" [ref=e439]:
            - cell "6/30/2026, 10:10:06 AM" [ref=e440]
            - cell "DA115" [ref=e441]
            - cell "CO" [ref=e442]
            - cell "4.83σ" [ref=e443]
            - cell "69m (6 readings)" [ref=e444]
            - cell "critical" [ref=e445]:
              - generic [ref=e446]: critical
          - row "6/29/2026, 7:10:06 PM DA115 H2 4.48σ 74m (7 readings) critical" [ref=e447]:
            - cell "6/29/2026, 7:10:06 PM" [ref=e448]
            - cell "DA115" [ref=e449]
            - cell "H2" [ref=e450]
            - cell "4.48σ" [ref=e451]
            - cell "74m (7 readings)" [ref=e452]
            - cell "critical" [ref=e453]:
              - generic [ref=e454]: critical
          - row "6/29/2026, 12:10:06 PM DA115 H2 3.97σ 38m (3 readings) warning" [ref=e455]:
            - cell "6/29/2026, 12:10:06 PM" [ref=e456]
            - cell "DA115" [ref=e457]
            - cell "H2" [ref=e458]
            - cell "3.97σ" [ref=e459]
            - cell "38m (3 readings)" [ref=e460]
            - cell "warning" [ref=e461]:
              - generic [ref=e462]: warning
          - row "6/28/2026, 10:10:06 PM DA115 H2 4.64σ 55m (3 readings) critical" [ref=e463]:
            - cell "6/28/2026, 10:10:06 PM" [ref=e464]
            - cell "DA115" [ref=e465]
            - cell "H2" [ref=e466]
            - cell "4.64σ" [ref=e467]
            - cell "55m (3 readings)" [ref=e468]
            - cell "critical" [ref=e469]:
              - generic [ref=e470]: critical
          - row "6/28/2026, 12:10:06 PM DA115 H2 4.58σ 80m (4 readings) critical" [ref=e471]:
            - cell "6/28/2026, 12:10:06 PM" [ref=e472]
            - cell "DA115" [ref=e473]
            - cell "H2" [ref=e474]
            - cell "4.58σ" [ref=e475]
            - cell "80m (4 readings)" [ref=e476]
            - cell "critical" [ref=e477]:
              - generic [ref=e478]: critical
          - row "6/27/2026, 6:10:06 PM DA115 WC 4.58σ 89m (4 readings) critical" [ref=e479]:
            - cell "6/27/2026, 6:10:06 PM" [ref=e480]
            - cell "DA115" [ref=e481]
            - cell "WC" [ref=e482]
            - cell "4.58σ" [ref=e483]
            - cell "89m (4 readings)" [ref=e484]
            - cell "critical" [ref=e485]:
              - generic [ref=e486]: critical
          - row "6/27/2026, 11:10:06 AM DA115 H2 4.71σ 48m (4 readings) critical" [ref=e487]:
            - cell "6/27/2026, 11:10:06 AM" [ref=e488]
            - cell "DA115" [ref=e489]
            - cell "H2" [ref=e490]
            - cell "4.71σ" [ref=e491]
            - cell "48m (4 readings)" [ref=e492]
            - cell "critical" [ref=e493]:
              - generic [ref=e494]: critical
          - row "6/27/2026, 7:10:06 AM DA115 WC 5.23σ 57m (8 readings) critical" [ref=e495]:
            - cell "6/27/2026, 7:10:06 AM" [ref=e496]
            - cell "DA115" [ref=e497]
            - cell "WC" [ref=e498]
            - cell "5.23σ" [ref=e499]
            - cell "57m (8 readings)" [ref=e500]
            - cell "critical" [ref=e501]:
              - generic [ref=e502]: critical
          - row "6/27/2026, 4:10:06 AM DA115 H2 3.98σ 73m (8 readings) warning" [ref=e503]:
            - cell "6/27/2026, 4:10:06 AM" [ref=e504]
            - cell "DA115" [ref=e505]
            - cell "H2" [ref=e506]
            - cell "3.98σ" [ref=e507]
            - cell "73m (8 readings)" [ref=e508]
            - cell "warning" [ref=e509]:
              - generic [ref=e510]: warning
          - row "6/26/2026, 10:10:06 PM DA115 WC 4.48σ 62m (4 readings) critical" [ref=e511]:
            - cell "6/26/2026, 10:10:06 PM" [ref=e512]
            - cell "DA115" [ref=e513]
            - cell "WC" [ref=e514]
            - cell "4.48σ" [ref=e515]
            - cell "62m (4 readings)" [ref=e516]
            - cell "critical" [ref=e517]:
              - generic [ref=e518]: critical
          - row "6/25/2026, 11:10:06 PM DA115 WC 4.97σ 36m (6 readings) critical" [ref=e519]:
            - cell "6/25/2026, 11:10:06 PM" [ref=e520]
            - cell "DA115" [ref=e521]
            - cell "WC" [ref=e522]
            - cell "4.97σ" [ref=e523]
            - cell "36m (6 readings)" [ref=e524]
            - cell "critical" [ref=e525]:
              - generic [ref=e526]: critical
          - row "6/25/2026, 5:10:06 PM DA115 CO 4.90σ 80m (7 readings) critical" [ref=e527]:
            - cell "6/25/2026, 5:10:06 PM" [ref=e528]
            - cell "DA115" [ref=e529]
            - cell "CO" [ref=e530]
            - cell "4.90σ" [ref=e531]
            - cell "80m (7 readings)" [ref=e532]
            - cell "critical" [ref=e533]:
              - generic [ref=e534]: critical
          - row "6/25/2026, 2:10:06 PM DA115 CO 4.38σ 56m (8 readings) critical" [ref=e535]:
            - cell "6/25/2026, 2:10:06 PM" [ref=e536]
            - cell "DA115" [ref=e537]
            - cell "CO" [ref=e538]
            - cell "4.38σ" [ref=e539]
            - cell "56m (8 readings)" [ref=e540]
            - cell "critical" [ref=e541]:
              - generic [ref=e542]: critical
          - row "6/25/2026, 2:10:06 AM DA115 H2 5.43σ 82m (3 readings) critical" [ref=e543]:
            - cell "6/25/2026, 2:10:06 AM" [ref=e544]
            - cell "DA115" [ref=e545]
            - cell "H2" [ref=e546]
            - cell "5.43σ" [ref=e547]
            - cell "82m (3 readings)" [ref=e548]
            - cell "critical" [ref=e549]:
              - generic [ref=e550]: critical
          - row "6/24/2026, 5:10:06 PM DA115 CO 4.61σ 74m (6 readings) critical" [ref=e551]:
            - cell "6/24/2026, 5:10:06 PM" [ref=e552]
            - cell "DA115" [ref=e553]
            - cell "CO" [ref=e554]
            - cell "4.61σ" [ref=e555]
            - cell "74m (6 readings)" [ref=e556]
            - cell "critical" [ref=e557]:
              - generic [ref=e558]: critical
      - generic [ref=e559]:
        - button "Previous" [disabled] [ref=e560]
        - generic [ref=e561]: Page 1 / 2
        - button "Next" [ref=e562] [cursor=pointer]
  - alert [ref=e563]
```

# Test source

```ts
  1   | /**
  2   |  * Component Integration Tests for Anomaly Features
  3   |  * 
  4   |  * Tests: AnomalySummaryPanel, CalendarHeatmap, ExportButton, ChatBotWidget
  5   |  * Run: npx playwright test tests/anomaly-components.spec.ts
  6   |  * 
  7   |  * Prerequisites:
  8   |  * - ThinkStation running (pm2 list shows dga-app + dga-anomaly-api online)
  9   |  * - VPN connected (for ChatBot Azure OpenAI)
  10  |  * - /etc/hosts entries for Azure OpenAI (for ChatBot)
  11  |  */
  12  | import { test, expect } from '@playwright/test';
  13  | 
  14  | const BASE_URL = 'https://100.123.214.57';
  15  | 
  16  | test.describe('AnomalySummaryPanel (Dashboard)', () => {
  17  |   test.beforeEach(async ({ page }) => {
  18  |     // Login
  19  |     await page.goto(`${BASE_URL}/dga/login`);
  20  |     await page.waitForLoadState('networkidle');
  21  |     await page.fill('#username', 'admin');
  22  |     await page.fill('#password', 'dga2024');
  23  |     await page.click('button[type="submit"]');
  24  |     await page.waitForURL(`${BASE_URL}/dga`);
  25  |     await page.waitForTimeout(8000);
  26  |     
  27  |     // Scroll to summary panel (below device cards)
  28  |     await page.evaluate('window.scrollTo(0, 800)');
  29  |     await page.waitForTimeout(2000);
  30  |   });
  31  | 
  32  |   test('should display Recent Anomalies heading', async ({ page }) => {
  33  |     const heading = page.locator('text=Recent Anomalies').first();
  34  |     await expect(heading).toBeVisible();
  35  |   });
  36  | 
  37  |   test('should show anomaly count badge', async ({ page }) => {
  38  |     const badge = page.locator('text=anomaly events detected').first();
  39  |     await expect(badge).toBeVisible();
  40  |   });
  41  | 
  42  |   test('should have View Full History button', async ({ page }) => {
  43  |     const btn = page.locator('button', { hasText: 'View Full History' });
  44  |     await expect(btn).toBeVisible();
  45  |   });
  46  | 
  47  |   test('View Full History navigates to history page', async ({ page }) => {
  48  |     await page.locator('button', { hasText: 'View Full History' }).click();
  49  |     await page.waitForTimeout(3000);
  50  |     expect(page.url()).toContain('/anomaly-history');
  51  |   });
  52  | });
  53  | 
  54  | test.describe('CalendarHeatmap (History Page)', () => {
  55  |   test.beforeEach(async ({ page }) => {
  56  |     await page.goto(`${BASE_URL}/dga/login`);
  57  |     await page.waitForLoadState('networkidle');
  58  |     await page.fill('#username', 'admin');
  59  |     await page.fill('#password', 'dga2024');
  60  |     await page.click('button[type="submit"]');
  61  |     await page.waitForURL(`${BASE_URL}/dga`);
  62  |     await page.waitForTimeout(8000);
  63  |     
  64  |     // Navigate to history page
  65  |     await page.goto(`${BASE_URL}/dga/anomaly-history`);
  66  |     await page.waitForLoadState('domcontentloaded');
  67  |     await page.waitForTimeout(8000);
  68  |   });
  69  | 
  70  |   test('should render calendar grid', async ({ page }) => {
  71  |     // Check for calendar cells (7 columns grid)
  72  |     const gridCells = await page.evaluate(() => {
  73  |       const grids = document.querySelectorAll('[style*="gridTemplateColumns"]');
  74  |       for (const g of grids) {
  75  |         if ((g as HTMLElement).style.gridTemplateColumns.includes('repeat(7')) {
  76  |           return (g as HTMLElement).children.length;
  77  |         }
  78  |       }
  79  |       return 0;
  80  |     });
> 81  |     expect(gridCells).toBeGreaterThan(30); // 7 days + 31 days
      |                       ^ Error: expect(received).toBeGreaterThan(expected)
  82  |   });
  83  | 
  84  |   test('should display month navigation', async ({ page }) => {
  85  |     const prevBtn = page.locator('button', { hasText: '←' }).first();
  86  |     const nextBtn = page.locator('button', { hasText: '→' }).first();
  87  |     await expect(prevBtn).toBeVisible();
  88  |     await expect(nextBtn).toBeVisible();
  89  |   });
  90  | 
  91  |   test('should show month label', async ({ page }) => {
  92  |     const monthLabel = await page.evaluate(() => {
  93  |       const headings = Array.from(document.querySelectorAll('h3'));
  94  |       return headings.find(h => h.textContent?.match(/January|February|March|April|May|June|July|August|September|October|November|December/))?.textContent || '';
  95  |     });
  96  |     expect(monthLabel.length).toBeGreaterThan(0);
  97  |   });
  98  | });
  99  | 
  100 | test.describe('ExportButton (History Page)', () => {
  101 |   test.beforeEach(async ({ page }) => {
  102 |     await page.goto(`${BASE_URL}/dga/login`);
  103 |     await page.waitForLoadState('networkidle');
  104 |     await page.fill('#username', 'admin');
  105 |     await page.fill('#password', 'dga2024');
  106 |     await page.click('button[type="submit"]');
  107 |     await page.waitForURL(`${BASE_URL}/dga`);
  108 |     await page.waitForTimeout(8000);
  109 |     
  110 |     await page.goto(`${BASE_URL}/dga/anomaly-history`);
  111 |     await page.waitForLoadState('domcontentloaded');
  112 |     await page.waitForTimeout(8000);
  113 |   });
  114 | 
  115 |   test('should display Export CSV button', async ({ page }) => {
  116 |     const csvBtn = page.locator('button', { hasText: 'Export CSV' });
  117 |     await expect(csvBtn).toBeVisible();
  118 |   });
  119 | 
  120 |   test('should display PDF Report button', async ({ page }) => {
  121 |     const pdfBtn = page.locator('button', { hasText: 'PDF Report' });
  122 |     await expect(pdfBtn).toBeVisible();
  123 |   });
  124 | 
  125 |   test('CSV export downloads file', async ({ page }) => {
  126 |     const [download] = await Promise.all([
  127 |       page.waitForEvent('download'),
  128 |       page.locator('button', { hasText: 'Export CSV' }).click(),
  129 |     ]);
  130 |     
  131 |     expect(download.suggestedFilename()).toContain('.csv');
  132 |     expect(download.suggestedFilename()).toContain('anomaly_events');
  133 |   });
  134 | });
  135 | 
  136 | test.describe('ChatBotWidget (Dashboard)', () => {
  137 |   test.beforeEach(async ({ page }) => {
  138 |     await page.goto(`${BASE_URL}/dga/login`);
  139 |     await page.waitForLoadState('networkidle');
  140 |     await page.fill('#username', 'admin');
  141 |     await page.fill('#password', 'dga2024');
  142 |     await page.click('button[type="submit"]');
  143 |     await page.waitForURL(`${BASE_URL}/dga`);
  144 |     await page.waitForTimeout(8000);
  145 |   });
  146 | 
  147 |   test('should display floating chat button', async ({ page }) => {
  148 |     const chatBtn = page.locator('button[title="DGA Assistant"]');
  149 |     await expect(chatBtn).toBeVisible();
  150 |   });
  151 | 
  152 |   test('clicking button opens chat window', async ({ page }) => {
  153 |     await page.locator('button[title="DGA Assistant"]').click();
  154 |     await page.waitForTimeout(1500);
  155 |     
  156 |     const chatWindow = page.locator('text=DGA Assistant').first();
  157 |     await expect(chatWindow).toBeVisible();
  158 |   });
  159 | 
  160 |   test('should show welcome message', async ({ page }) => {
  161 |     await page.locator('button[title="DGA Assistant"]').click();
  162 |     await page.waitForTimeout(1500);
  163 |     
  164 |     const welcome = page.locator('text=DGA Assistant').first();
  165 |     await expect(welcome).toBeVisible();
  166 |   });
  167 | 
  168 |   test('should send message and receive response', async ({ page }) => {
  169 |     await page.locator('button[title="DGA Assistant"]').click();
  170 |     await page.waitForTimeout(1500);
  171 |     
  172 |     // Type message
  173 |     await page.locator('input[placeholder="พิมพ์คำถาม..."]').fill('ค่า Z-Score ปกติอยู่ช่วงไหน?');
  174 |     await page.locator('button', { hasText: 'ส่ง' }).click();
  175 |     
  176 |     // Wait for AI response (up to 15 seconds)
  177 |     await page.waitForTimeout(15000);
  178 |     
  179 |     // Check that a response appeared (different from user message)
  180 |     const messages = await page.evaluate(() => {
  181 |       const divs = Array.from(document.querySelectorAll('div'));
```