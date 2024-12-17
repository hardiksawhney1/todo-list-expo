import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUserStore } from "../../stores/UserStoreContext";
import { useSearchBool } from "../../stores/SearchContext";
import {bulletpoint} from '../../assets'; 

const Tags = () => {
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<any[]>([]);
  const [filteredTags, setFilteredTags] = useState<any[]>([]);
  const [tagExistsError, setTagExistsError] = useState(false); 
  const userStore = useUserStore();
  const { user } = userStore;
  const { search, setSearch } = useSearchBool();
  const [searchVal, setSearchVal] = useState("");
  const customHeaderHeight = 130;

  useEffect(() => {
    const fetchTags = async () => {
      if (user) {
        const tagsCollection = collection(db, "tags");
        const q = query(
          tagsCollection,
          where("uid", "==", user.uid),
          orderBy("date", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const tagsList: any[] = [];
          snapshot.forEach((doc) => {
            tagsList.push({
              tagId: doc.id,
              tagName: doc.data().tagName,
            });
          });
          setTags(tagsList.reverse());
          setFilteredTags(tagsList.reverse());
        });

        return () => unsubscribe();
      }
    };

    fetchTags();
  }, [user]);

  const addTag = async () => {
    if (newTag.trim() === "") {
      return; // Do not add empty tags
    }
    if (user) {
      try {
        const tagsCollection = collection(db, "tags");

        // Check if the tag already exists
        const querySnapshot = await getDocs(
          query(tagsCollection, where("tagName", "==", newTag.trim()))
        );

        if (!querySnapshot.empty) {
          // Tag already exists, set error state and return
          setTagExistsError(true);
          return;
        }

        // If the tag doesn't exist, add it to Firestore
        setNewTag("");
        setTagExistsError(false);
        await addDoc(tagsCollection, {
          tagName: newTag.trim(),
          uid: user.uid,
          date: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error adding tag:", err);
      }
    }
  };

  useEffect(() => {
    if (searchVal === '') {
      setFilteredTags(tags);
    } else {
      setFilteredTags(tags.filter(tag => 
        tag.tagName.toLowerCase().includes(searchVal.toLowerCase())
      ));
    }
  }, [searchVal, tags]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.tagItem}>
      <Image source={bulletpoint} style={styles.bulletPoint} />
      <Text style={styles.tagText}>{item.tagName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {search ? (
        <TextInput
          onChangeText={(e) => setSearchVal(e)}
          style={styles.searchBar}
          placeholder="Search tags..."
          value={searchVal}
        />
      ) : null}
      <View style={{ height: customHeaderHeight }} />
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, tagExistsError && styles.inputError]} // Apply inputError style if tag exists error
          placeholder="Add tag"
          value={newTag}
          onChangeText={setNewTag}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTag}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {tagExistsError && (
        <Text style={styles.errorText}>Tag already exists</Text>
      )}

      <FlatList
        data={filteredTags}
        renderItem={renderItem}
        keyExtractor={(item) => item.tagId}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    top: 10,
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  inputError: {
    borderColor: "red", 
  },
  addButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: 'rgba(82, 100, 204, 0.9)',
    borderRadius: 5,
  },
  list: {
    width: "100%",
    marginTop: 10,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15, // Increased padding by 1.5 times
    borderRadius: 5,
    marginBottom: 15, // Increased margin bottom by 1.5 times
    backgroundColor: "#f0f0f0",
  },
  bulletPoint: {
    width: 15, // Increased size by 1.5 times
    height: 15, // Increased size by 1.5 times
    marginRight: 15, // Increased margin by 1.5 times
  },
  tagText: {
    fontSize: 16, // Increased font size by 1.5 times
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
});

export default Tags;
