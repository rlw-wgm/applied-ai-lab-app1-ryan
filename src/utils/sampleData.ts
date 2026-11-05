import { OrderRow } from '../types';

export const SAMPLE_CSV_DATA = `quarter,region,channel,product,units,discount_pct,revenue
Q1,North America,Direct Enterprise,Cloud Enterprise Suite,250,5.0,2375000
Q1,North America,Online Platform,AI Analytics Hub,420,10.0,840000
Q1,North America,Wholesale Partner,CyberSec Shield,600,15.0,1020000
Q1,North America,Direct Enterprise,Quantum DB,180,8.0,1656000
Q1,EMEA,Direct Enterprise,Cloud Enterprise Suite,190,7.0,1767000
Q1,EMEA,Wholesale Partner,CyberSec Shield,450,12.0,792000
Q1,EMEA,Online Platform,AI Analytics Hub,310,10.0,620000
Q1,APAC,Online Platform,Cloud Enterprise Suite,140,6.0,1316000
Q1,APAC,Direct Enterprise,AI Analytics Hub,260,8.0,520000
Q1,APAC,Wholesale Partner,Quantum DB,110,14.0,946000
Q1,LATAM,Online Platform,AI Analytics Hub,150,12.0,300000
Q1,LATAM,Wholesale Partner,CyberSec Shield,220,18.0,360800
Q2,North America,Direct Enterprise,Cloud Enterprise Suite,280,6.0,2632000
Q2,North America,Online Platform,AI Analytics Hub,460,8.0,920000
Q2,North America,Wholesale Partner,CyberSec Shield,650,14.0,1118000
Q2,North America,Direct Enterprise,Quantum DB,210,7.0,1953000
Q2,EMEA,Direct Enterprise,Cloud Enterprise Suite,210,6.0,1974000
Q2,EMEA,Wholesale Partner,CyberSec Shield,490,10.0,882000
Q2,EMEA,Online Platform,AI Analytics Hub,340,9.0,680000
Q2,EMEA,Direct Enterprise,Quantum DB,140,8.0,1288000
Q2,APAC,Online Platform,Cloud Enterprise Suite,160,5.0,1520000
Q2,APAC,Direct Enterprise,AI Analytics Hub,290,7.0,580000
Q2,APAC,Wholesale Partner,Quantum DB,125,12.0,1100000
Q2,APAC,Online Platform,CyberSec Shield,300,10.0,540000
Q2,LATAM,Online Platform,AI Analytics Hub,160,11.0,320000
Q2,LATAM,Wholesale Partner,CyberSec Shield,240,16.0,403200
Q2,LATAM,Direct Enterprise,Cloud Enterprise Suite,75,9.0,682500
Q3,North America,Direct Enterprise,Cloud Enterprise Suite,310,5.0,2945000
Q3,North America,Online Platform,AI Analytics Hub,510,7.0,1020000
Q3,North America,Wholesale Partner,CyberSec Shield,710,12.0,1249600
Q3,North America,Direct Enterprise,Quantum DB,240,6.0,2256000
Q3,EMEA,Direct Enterprise,Cloud Enterprise Suite,220,5.0,2090000
Q3,EMEA,Wholesale Partner,CyberSec Shield,505,9.0,919100
Q3,EMEA,Online Platform,AI Analytics Hub,360,8.0,720000
Q3,EMEA,Direct Enterprise,Quantum DB,155,7.0,1441500
Q3,APAC,Online Platform,Cloud Enterprise Suite,390,4.0,3744000
Q3,APAC,Direct Enterprise,AI Analytics Hub,620,5.0,1240000
Q3,APAC,Wholesale Partner,Quantum DB,260,9.0,2366000
Q3,APAC,Online Platform,CyberSec Shield,580,8.0,1067200
Q3,LATAM,Online Platform,AI Analytics Hub,175,10.0,350000
Q3,LATAM,Wholesale Partner,CyberSec Shield,260,15.0,442000
Q3,LATAM,Direct Enterprise,Cloud Enterprise Suite,90,8.0,828000
Q4,North America,Direct Enterprise,Cloud Enterprise Suite,360,4.0,3456000
Q4,North America,Online Platform,AI Analytics Hub,590,6.0,1180000
Q4,North America,Wholesale Partner,CyberSec Shield,800,10.0,1440000
Q4,North America,Direct Enterprise,Quantum DB,280,5.0,2660000
Q4,EMEA,Direct Enterprise,Cloud Enterprise Suite,270,4.0,2592000
Q4,EMEA,Wholesale Partner,CyberSec Shield,580,8.0,1067200
Q4,EMEA,Online Platform,AI Analytics Hub,420,7.0,840000
Q4,EMEA,Direct Enterprise,Quantum DB,190,6.0,1786000
Q4,APAC,Online Platform,Cloud Enterprise Suite,430,3.0,4171000
Q4,APAC,Direct Enterprise,AI Analytics Hub,690,4.0,1380000
Q4,APAC,Wholesale Partner,Quantum DB,290,8.0,2668000
Q4,APAC,Online Platform,CyberSec Shield,640,7.0,1190400
Q4,LATAM,Online Platform,AI Analytics Hub,195,9.0,390000
Q4,LATAM,Wholesale Partner,CyberSec Shield,290,14.0,498800
Q4,LATAM,Direct Enterprise,Cloud Enterprise Suite,110,7.0,1023000`;

export function getSampleRows(): OrderRow[] {
  const lines = SAMPLE_CSV_DATA.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  return lines.slice(1).map((line, idx) => {
    const parts = line.split(',').map(p => p.trim());
    return {
      id: `row-${idx + 1}`,
      quarter: parts[0],
      region: parts[1],
      channel: parts[2],
      product: parts[3],
      units: parseFloat(parts[4]) || 0,
      discount_pct: parseFloat(parts[5]) || 0,
      revenue: parseFloat(parts[6]) || 0,
    };
  });
}
