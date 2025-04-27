import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../styles/AppStyles';
import { FontAwesome } from '@expo/vector-icons';

const ResetPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateInputs = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = 'L\'email est requis.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Veuillez entrer un email valide.';
    }

    if (!newPassword.trim()) {
      errors.password = 'Le mot de passe est requis.';
    } else if (newPassword.length < 6) {
      errors.password = 'Le mot de passe doit comporter au moins 6 caractères.';
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = () => {
    if (!validateInputs()) {
      return;
    }

    Alert.alert('Succès', 'Votre mot de passe a été réinitialisé avec succès !');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loginTitle}>Réinitialisation du mot de passe</Text>

      <TextInput
        style={[styles.input, errors.email && { borderColor: 'red' }]}
        placeholder="Adresse e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, errors.password && { borderColor: 'red' }]}
          placeholder="Nouveau mot de passe"
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#E73E01" />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Réinitialiser le mot de passe</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.forgotPasswordText}>Retour à la connexion</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ResetPassword;