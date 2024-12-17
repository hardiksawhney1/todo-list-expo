import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Button,
  Modal as RNModal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { boyIcon } from "../assets";
import CustomDropdown from "./Components/CustomDropDown"; // Adjust the import path as necessary
import CustomDateTimePicker from "./Components/CustomDateTimePicker"; // Import the CustomDateTimePicker
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust the path as necessary
import { useUserStore } from "../stores/UserStoreContext";
import { TaskRefreshContext } from "../stores/TaskRefreshContext";
import { useSearchBool } from "../stores/SearchContext";

type Tag = string;
interface Task {
    taskName: string;
    dueDate?: string;
    category: string;
    tagNames: string[];
    uid: string;
    date: string;
  }
const Modal: React.FC = () => {
  const [taskName, setTaskName] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [name, setName] = useState("")
  const [tags, setTags] = useState<Tag[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [isTagModalVisible, setIsTagModalVisible] = useState<boolean>(false);
  const [newTag, setNewTag] = useState<string>("");
  const [tagError, setTagError] = useState<string>("");
  const [tagPlaceholder, setTagPlaceholder] = useState<string>("Enter tag");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [tagInputFocused, setTagInputFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // State for activity indicator
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false); // State for success popup
  const userStore = useUserStore();
  const { user } = userStore;
  const { setRefreshTasks } = useContext(TaskRefreshContext);
  const { search, contentArray, setContentArray } = useSearchBool();


  useEffect(() => {
    const fetchTags = async () => {
      if (user) {
        const tagsCollection = collection(db, "tags");
        const q = query(
          tagsCollection,
          where("uid", "==", user.uid),
          orderBy("tagName")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const tagsList: Tag[] = [];
          snapshot.forEach((doc) => {
            tagsList.push(doc.data().tagName);
          });
          setSuggestions(tagsList);
        });

        return unsubscribe;
      }
    };

    fetchTags();
  }, [user]);

  const addTag = () => {
    if (newTag.trim() === "") {
      setTagError("Please enter a tag.");
      return;
    }

    if (tags.includes(newTag.trim())) {
      setTagError("Tag already added.");
      return;
    }

    setTags([...tags, newTag.trim()]);
    setNewTag("");
    setTagError("");

    const count = tags.length + 1;
    setTagPlaceholder(
      `Enter tag (${count} tag${count === 1 ? "" : "s"} applied)`
    );
  };

  const removeTag = (index: number) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);

    const count = updatedTags.length;
    setTagPlaceholder(
      count === 0
        ? "Enter tag"
        : `Enter tag (${count} tag${count === 1 ? "" : "s"} applied)`
    );
  };

  const filterTags = (value: string) => {
    const filteredTags = suggestions.filter((tag) =>
      tag.toLowerCase().includes(value.toLowerCase())
    );
    return filteredTags;
  };

  const isSubmitDisabled = () => {
    return (
      taskName.trim().length === 0 ||
      category.trim().length === 0 ||
      tags.length === 0 ||
      !dueDate
    );
  };

  const router = useRouter();
  const handleSubmit = async () => {
    try {
      setIsLoading(false); // Show activity indicator

      // Fetch the reference ID of the selected category
      const categoryRefId = category;

      // Create an array to store the reference IDs of the tags
      const tagRefIds = [];

      for (const tag of tags) {
        const tagsCollection = collection(db, "tags");
        const q = query(tagsCollection, where("tagName", "==", tag));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // If the tag doesn't exist, add it to the 'tags' collection
          const newTagRef = await addDoc(tagsCollection, {
            tagName: tag,
            uid: user.uid,
            date: new Date().toISOString(),
          });
          tagRefIds.push(newTagRef.id);
        } else {
          // If the tag exists, use its reference ID
          querySnapshot.forEach((doc) => {
            tagRefIds.push(doc.id);
          });
        }
      }
const newArr: Task[] =contentArray;
newArr.unshift({
    taskName: taskName.trim(),
    dueDate: dueDate?.toISOString().split("T")[0],
    category: name,
    tagNames:tags,
    uid: user.uid,
    date: new Date().toISOString().split("T")[0],
  })
 
  setContentArray(newArr)
  console.log(contentArray,"modal");
  
      router.back(); // Navigate back
      router.push("screens/Tasks"); // Navigate to Tasks screen
      

      // Add a new task to the 'tasks' collection
      const newTaskRef = await addDoc(collection(db, "tasks"), {
        taskName: taskName.trim(),
        dueDate: dueDate?.toISOString(),
        categoryRefId: categoryRefId,
        tagRefIds: tagRefIds,
        uid: user.uid,
        date: new Date().toISOString(),
      });

      // Add entry to 'status' collection
      await addDoc(collection(db, "status"), {
        taskId: newTaskRef.id,
        taskCompleted: false,
        date: new Date().toISOString(),
      });

      // Reset the form
      setTaskName("");
      setCategory("");
      setTags([]);
      setDueDate(null);
      setTagPlaceholder("Enter tag");
      setIsTagModalVisible(false);

      // Show success message for 2 seconds
      setShowSuccessMessage(true);
      setTimeout(() => {
        setIsLoading(false); // Hide activity indicator
        setShowSuccessMessage(false);
        setRefreshTasks(true); // Trigger a refresh of tasks
        // router.back(); // Navigate back
        // router.push("screens/Tasks"); // Navigate to Tasks screen
      }, 2000);
    } catch (error) {
      console.error("Error adding task: ", error);
      setIsLoading(false); // Hide activity indicator on error
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
      <StatusBar style="light" />
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 20,
          alignSelf: "center",
          padding: 10,
        }}
        onPress={() => {
          router.back();
        }}
      >
        <View
          style={{
            width: 40,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: "black",
          }}
        />
      </TouchableOpacity>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Image source={boyIcon} contentFit="contain" style={styles.boyIcon} />
      </View>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Task Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task name"
            value={taskName}
            onChangeText={setTaskName}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <CustomDropdown
            selectedValue={category}
            onValueChange={setCategory}
            placeholder="Select Category"
            setName={setName}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagsContainer}>
            <TextInput
              style={[styles.tagInput, { flex: 1 }]}
              placeholder={tagPlaceholder}
              value={newTag}
              onChangeText={(value) => {
                setNewTag(value);
                setTagError("");
                if (value.trim() !== "") {
                  setTagInputFocused(true);
                } else {
                  setTagInputFocused(false);
                }
              }}
              onBlur={() => setTagInputFocused(false)}
            />
            <TouchableOpacity onPress={addTag} style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {tagError ? <Text style={styles.error}>{tagError}</Text> : null}
          {tagInputFocused && newTag.trim() !== "" && (
            <FlatList
              data={filterTags(newTag)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setNewTag(item);
                    setTagInputFocused(false);
                  }}
                >
                  <Text>{item.substr(0, newTag.length)}</Text>
                  <Text>{item.substr(newTag.length)}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              style={styles.suggestionsList}
            />
          )}
          <TouchableOpacity
            onPress={() => setIsTagModalVisible(true)}
            style={styles.viewTagsButton}
          >
            <Text style={styles.viewTagsButtonText}>View Applied Tags</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Due Date</Text>
          <CustomDateTimePicker
            selectedDate={dueDate}
            onDateChange={setDueDate}
          />
        </View>
      </View>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Button
          title="Submit"
          onPress={handleSubmit}
          disabled={isSubmitDisabled()}
        />
      </View>

      {isLoading && (
        <View style={styles.activityIndicator}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      <RNModal
        visible={isTagModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTagModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Applied Tags</Text>
            {tags.length === 0 ? (
              <Text>No tags applied.</Text>
            ) : (
              tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Text>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(index)}>
                    <Icon name="close" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))
            )}
            <Button title="Close" onPress={() => setIsTagModalVisible(false)} />
          </View>
        </View>
      </RNModal>

      {showSuccessMessage && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>Task added successfully!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  boyIcon: {
    height: 200,
    width: 200,
    marginBottom: 20,
  },
  form: {
    width: "100%",
    alignItems: "flex-start",
  },
  field: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  tagInput: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    flex: 1,
  },
  addButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginTop: 5,
  },
  viewTagsButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    alignItems: "center",
  },
  viewTagsButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 5,
  },
  suggestionsList: {
    maxHeight: 150,
    marginTop: 5,
    width: "100%",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  activityIndicator: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    paddingHorizontal: 0,
  },
  successMessage: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#5cb85c",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  successText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Modal;

