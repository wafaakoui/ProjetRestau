import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2526',
    padding: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E73E01',
    margin: 5,
    backgroundColor: '#E73E01',
  },
  filterButtonActive: {
    backgroundColor: '#E73E01',
    borderColor: '#FFF',
  },
  filterText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  ticketContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    margin: 5,
    width: Math.max((width - 60) / Math.floor(width / 300), 200),
    minHeight: 250,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#E73E01',
  },
  completedTicket: {
    borderLeftColor: '#28A745',
  },
  ticketContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  ticketTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  ticketDate: {
    fontSize: 12,
    color: '#666',
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  ticketUniqueId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  ticketItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  radioButtonSelected: {
    backgroundColor: '#E73E01',
  },
  ticketItem: {
    fontSize: 14,
    color: '#333',
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  printButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#E73E01',
  },
  printButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  validateButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#28A745', // Green when enabled
  },
  validateButtonDisabled: {
    backgroundColor: '#CCCCCC', // Gray when disabled
  },
  validateButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 450,
    borderWidth: 1,
    borderColor: '#E73E01',
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  scrollView: {
    maxHeight: height * 0.5,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#E73E01',
    marginVertical: 15,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#E73E01',
    marginHorizontal: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  paginationButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  pageText: {
    fontSize: 16,
    color: '#FFF',
    marginHorizontal: 10,
  },
});