import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, StyleSheet, TextInput } from 'react-native';
import { useUserStore } from '../../stores/UserStoreContext';
import { addDoc, collection, getDocs, onSnapshot, orderBy, query, where } from '@firebase/firestore';
import { db } from '../../firebaseConfig';

type CustomDropdownProps = {
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  setName:(value: string) => void;
};

const CustomDropdown: React.FC<CustomDropdownProps> = ({ selectedValue, onValueChange, placeholder , setName}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryExistsError, setCategoryExistsError] = useState(false); // State for error message
  const userStore = useUserStore();
  const { user } = userStore;

  useEffect(() => {
    const fetchCategories = async () => {
      if (user) {
        const categoryCollection = collection(db, 'category');
        const q = query(categoryCollection, where('uid', '==', user.uid), orderBy("date", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const categoryList: any[] = [];
          snapshot.forEach((doc) => {
            categoryList.push({
              categoryId: doc.id,
              categoryName: doc.data().taskCategory,
            });
          });
          setCategories(categoryList.reverse());
        });

        return () => unsubscribe();
      }
    };

    fetchCategories();
  }, [user]);

  const addCategory = async () => {
    if (newCategory.trim() === '') {
      return; // Do not add empty categories
    }
    if (user) {
      try {
        const categoryCollection = collection(db, 'category');
  
        // Check if the category already exists
        const querySnapshot = await getDocs(
          query(categoryCollection, where('taskCategory', '==', newCategory.trim()))
        );
  
        if (!querySnapshot.empty) {
          // Category already exists, show error message
          setCategoryExistsError(true);
          return;
        }
  
        // If the category doesn't exist, add it to the collection
        setNewCategory('');
        await addDoc(categoryCollection, {
          taskCategory: newCategory.trim(),
          uid: user.uid,
          date: new Date().toISOString()
        });
  
        // Reset error state after successful addition
        setCategoryExistsError(false);
        
      } catch (err) {
        console.error('Firestore operation failed:', err);
        // Handle specific errors here based on your application's needs
      }
    }
  };
  

  const renderItem = ({ item }: { item: { label: string, value: string } }) => (
    <TouchableOpacity
      onPress={() => {
        onValueChange(item.value);
        setModalVisible(false);
        setName(item.label)
      }}
      style={styles.item}
    >
      <Text>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.dropdown}>
        <Text>{selectedValue ? categories.find(item => item.categoryId === selectedValue)?.categoryName : placeholder}</Text>
      </TouchableOpacity>
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={categories.map(category => ({ label: category.categoryName, value: category.categoryId }))}
              renderItem={renderItem}
              keyExtractor={item => item.value}
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add category"
                value={newCategory}
                onChangeText={setNewCategory}
              />
              <TouchableOpacity style={styles.addButton} onPress={addCategory}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {categoryExistsError && (
              <Text style={styles.errorText}>Category already exists!</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  addButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
  },
  errorText: {
    color: 'red',
    marginTop: 5,
  },
});

export default CustomDropdown;
