import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUserStore } from '../../stores/UserStoreContext';
import { useSearchBool } from '../../stores/SearchContext';
import {bulletpoint} from '../../assets'; // Adjust the path to your bulletpoint image

const Categories = () => {
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [categoryExistsError, setCategoryExistsError] = useState(false); // State to track category existence error
  const userStore = useUserStore();
  const { user } = userStore;
  const { search, setSearch } = useSearchBool();
  const [searchVal, setSearchVal] = useState("");
  const customHeaderHeight = 130;

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
          setFilteredCategories(categoryList.reverse());
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
          // Category already exists, set error state and return
          setCategoryExistsError(true);
          return;
        }

        // If the category doesn't exist, add it to Firestore
        setNewCategory('');
        setCategoryExistsError(false);
        await addDoc(categoryCollection, { 
          taskCategory: newCategory.trim(), 
          uid: user.uid,
          date: new Date().toISOString() 
        });

        // Reset error state after successful addition
        
      } catch (err) {
        console.error('Error adding category:', err);
      }
    }
  };

  useEffect(() => {
    if (searchVal === '') {
      setFilteredCategories(categories);
    } else {
      setFilteredCategories(categories.filter(category => 
        category.categoryName.toLowerCase().includes(searchVal.toLowerCase())
      ));
    }
  }, [searchVal, categories]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.categoryItem}>
      <Image source={bulletpoint} style={styles.bulletPoint} />
      <Text style={styles.categoryText}>{item.categoryName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {search ? (
        <TextInput
          onChangeText={(e) => setSearchVal(e)}
          style={styles.searchBar}
          placeholder="Search tasks..."
          value={searchVal}
        />
      ) : null}
      <View style={{ height: customHeaderHeight }} />
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, categoryExistsError && styles.inputError]} // Apply inputError style if category exists error
          placeholder="Add category"
          value={newCategory}
          onChangeText={setNewCategory}
        />
        <TouchableOpacity style={styles.addButton} onPress={addCategory}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {categoryExistsError && (
        <Text style={styles.errorText}>Category already exists</Text>
      )}

      <FlatList
        data={filteredCategories}
        renderItem={renderItem}
        keyExtractor={(item) => item.categoryId}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  searchBar: {
    top: 140,
    zIndex: 50,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  inputError: {
    borderColor: 'red', // Red border color for error state
  },
  addButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: 'rgba(82, 100, 204, 1)',
    borderRadius: 5,
  },
  list: {
    width: '100%',
    marginTop: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15, // Increased padding by 1.5 times
    borderRadius: 5,
    marginBottom: 15, // Increased margin bottom by 1.5 times
    backgroundColor: '#f0f0f0',
  },
  bulletPoint: {
    width: 15, // Increased size by 1.5 times
    height: 15, // Increased size by 1.5 times
    marginRight: 15, // Increased margin by 1.5 times
  },
  categoryText: {
    fontSize: 18, // Increased font size by 1.5 times
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default Categories;
