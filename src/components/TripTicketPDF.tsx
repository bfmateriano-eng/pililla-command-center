'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// --- 1. STYLES ---
const styles = StyleSheet.create({
  page: { 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    backgroundColor: '#fff' 
  },
  column: {
    width: '48.5%',
    border: '1pt solid #000',
    padding: 8,
    height: '100%',
    flexDirection: 'column'
  },
  header: { textAlign: 'center', marginBottom: 2 },
  headerTitle: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  headerSub: { fontSize: 7, marginBottom: 4 },
  
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  fieldLine: { borderBottom: '0.5pt solid #000', flex: 1, marginLeft: 5, minHeight: 10 },
  
  sectionHeader: { fontSize: 7, fontWeight: 'bold', marginTop: 2 },
  fieldLabel: { fontSize: 7, marginTop: 3 },
  
  manifestBox: { marginTop: 2, marginBottom: 5 },
  manifestLine: { borderBottom: '0.5pt solid #000', height: 12, width: '100%' },
  manifestText: { fontSize: 7, position: 'absolute', top: 0, left: 5 },

  calcRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  calcLabel: { fontSize: 7, width: '60%' },
  calcValue: { borderBottom: '0.5pt solid #000', flex: 1, fontSize: 7, textAlign: 'center' },

  signatureGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  sigBox: { width: '48%', textAlign: 'center' },
  sigName: { fontSize: 8, fontWeight: 'bold', borderBottom: '0.5pt solid #000', marginTop: 8 },
  sigLabel: { fontSize: 6, marginTop: 1 },

  divider: { borderTop: '1pt dashed #000', marginVertical: 8 }
})

// --- 2. INTERNAL CONTENT COMPONENT ---
const TicketContent = ({ data, displayId }: { data: any, displayId: string }) => {
  // Extract patients and places for display
  const patients = data.dispatch_logs?.flatMap((disp: any) => 
    disp.patient_manifest?.map((p: any) => p.name)
  ).join(', ') || '';

  const places = data.dispatch_logs?.flatMap((disp: any) => 
    disp.patient_manifest?.flatMap((p: any) => p.destinations?.map((dest: any) => dest.name))
  ).filter((v: any, i: any, a: any) => a.indexOf(v) === i).join('; ') || '';

  return (
    <View style={styles.column}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TRIP TICKET</Text>
        <Text style={styles.headerSub}>(With request for use of service vehicle)</Text>
      </View>

      <View style={styles.dateRow}>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <Text style={styles.fieldLabel}>Control No:</Text>
          <Text style={[styles.fieldLine, { fontSize: 8, fontWeight: 'bold', color: '#b91c1c' }]}>{displayId}</Text>
        </View>
        <View style={{ flexDirection: 'row', width: 100, marginLeft: 10 }}>
          <Text style={styles.fieldLabel}>Date:</Text>
          <Text style={[styles.fieldLine, { fontSize: 8 }]}>{new Date(data.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>A. To be filled up by end-user/requesting office:</Text>
      
      <Text style={styles.fieldLabel}>1. Name of authorized passenger/s:</Text>
      <View style={styles.manifestBox}>
        <View style={styles.manifestLine}><Text style={styles.manifestText}>{patients.slice(0, 50)}</Text></View>
        <View style={styles.manifestLine}><Text style={styles.manifestText}>{patients.slice(50, 100)}</Text></View>
        <View style={styles.manifestLine}><Text style={styles.manifestText}>{patients.slice(100)}</Text></View>
      </View>

      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.fieldLabel}>2. Date and time of travel:</Text>
        <Text style={styles.fieldLine}>{new Date(data.created_at).toLocaleString()}</Text>
      </View>

      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.fieldLabel}>3. Purpose of travel:</Text>
        <Text style={[styles.fieldLine, { fontSize: 7, fontWeight: 'bold' }]}>MEDICAL EMERGENCY</Text>
      </View>

      <Text style={styles.fieldLabel}>4. Place/s to be visited:</Text>
      <View style={styles.manifestLine}><Text style={styles.manifestText}>{places}</Text></View>

      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.fieldLabel}>5. Expected duration of travel:</Text>
        <Text style={styles.fieldLine}>AS NEEDED</Text>
      </View>

      <View style={styles.signatureGrid}>
        <View style={styles.sigBox}>
          <Text style={styles.sigLabel}>Requested by:</Text>
          <Text style={styles.sigName}> </Text>
          <Text style={styles.sigLabel}>End-User</Text>
        </View>
        <View style={styles.sigBox}>
          <Text style={styles.sigLabel}>Recommending Approval:</Text>
          <Text style={styles.sigName}>{" "}</Text>
          <Text style={styles.sigLabel}>Dept. Head</Text>
        </View>
      </View>

      <View style={{ marginVertical: 4, borderTop: '0.5pt solid #000' }} />

      <View style={styles.calcRow}>
        <Text style={styles.calcLabel}>1. Name of assigned driver:</Text>
        <Text style={styles.calcValue}>{data.drivers?.full_name}</Text>
      </View>
      <View style={styles.calcRow}>
        <Text style={styles.calcLabel}>2. Vehicle/Plate no.:</Text>
        <Text style={styles.calcValue}>{data.ambulances?.call_sign} / {data.ambulances?.plate_number}</Text>
      </View>
      <View style={styles.calcRow}>
        <Text style={styles.calcLabel}>3. Approved purchase of gasoline:</Text>
        <Text style={styles.calcValue}>PHP {data.total_amount?.toLocaleString()}</Text>
      </View>
      
      <Text style={styles.fieldLabel}>4. Gasoline/Oil consumed:</Text>
      <View style={[styles.calcRow, { paddingLeft: 10 }]}>
        <Text style={styles.calcLabel}>   Bal. per fuel gauge before this travel:</Text>
        <Text style={styles.calcValue}>{" "}</Text>
      </View>
      <View style={[styles.calcRow, { paddingLeft: 10 }]}>
        <Text style={styles.calcLabel}>   Add: Purchase, this travel:</Text>
        <Text style={styles.calcValue}>{data.actual_liters} L</Text>
      </View>
      <View style={[styles.calcRow, { paddingLeft: 10 }]}>
        <Text style={styles.calcLabel}>   Total:</Text>
        <Text style={styles.calcValue}>{" "}</Text>
      </View>
      <View style={[styles.calcRow, { paddingLeft: 10 }]}>
        <Text style={styles.calcLabel}>   Less: Consumed, this travel:</Text>
        <Text style={styles.calcValue}>{" "}</Text>
      </View>
      <View style={[styles.calcRow, { paddingLeft: 10 }]}>
        <Text style={styles.calcLabel}>   Bal. per fuel gauge after this travel:</Text>
        <Text style={styles.calcValue}>{" "}</Text>
      </View>

      <Text style={[styles.fieldLabel, { fontSize: 6, marginTop: 4 }]}>5. Certifies that the assigned car is in sound running condition</Text>

      <View style={styles.signatureGrid}>
        <View style={styles.sigBox}>
          <Text style={styles.sigLabel}>Approved by:</Text>
          <Text style={styles.sigName}> </Text>
          <Text style={styles.sigLabel}>Dispatcher</Text>
        </View>
        <View style={styles.sigBox}>
          <Text style={styles.sigLabel}>Approved by:</Text>
          <Text style={styles.sigName}> </Text>
          <Text style={styles.sigLabel}>GSO Head</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionHeader}>C. To be filled-up by the driver:</Text>
      <View style={styles.calcRow}><Text style={styles.calcLabel}>1. Time of departure from office/garage:</Text><Text style={styles.calcValue}>{" "}</Text></View>
      <View style={styles.calcRow}><Text style={styles.calcLabel}>2. Time of arrival to office/garage:</Text><Text style={styles.calcValue}>{" "}</Text></View>
      <View style={styles.calcRow}><Text style={styles.calcLabel}>3. Approximate actual time and distance travelled:</Text><Text style={styles.calcValue}>{" "}</Text></View>
      
      <View style={[styles.calcRow, { marginTop: 4 }]}>
        <Text style={styles.calcLabel}>4. Odometer reading: Beg of trip:</Text>
        <Text style={[styles.calcValue, { flex: 0, width: 40 }]}>{data.odometer_reading}</Text>
        <Text style={[styles.calcLabel, { width: 'auto', marginLeft: 10 }]}>End of trip:</Text>
        <Text style={styles.calcValue}>{" "}</Text>
      </View>

      <View style={styles.signatureGrid}>
        <View style={styles.sigBox}>
          <Text style={styles.sigLabel}>Certified correct:</Text>
          <Text style={[styles.sigName, { marginTop: 12 }]}>{" "}</Text>
          <Text style={styles.sigLabel}>Driver</Text>
        </View>
        <View style={styles.sigBox}>
          <Text style={styles.sigLabel}>Certified correct:</Text>
          <Text style={[styles.sigName, { marginTop: 12 }]}>{" "}</Text>
          <Text style={styles.sigLabel}>Dispatcher</Text>
        </View>
      </View>
    </View>
  )
}

// --- 3. MAIN EXPORTED DOCUMENT ---
export const TripTicketDocument = ({ data, missionIndex }: { data: any, missionIndex: number }) => {
  // Logic to create the sequential ID based on the date provided in the PO
  const subNumber = missionIndex.toString().padStart(2, '0');
  const fullTrackingId = `${data?.tracking_id || 'PENDING'}-${subNumber}`;

  return (
    <Document title={`Trip Ticket - ${fullTrackingId}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <TicketContent data={data} displayId={fullTrackingId} />
        <TicketContent data={data} displayId={fullTrackingId} />
      </Page>
    </Document>
  )
}