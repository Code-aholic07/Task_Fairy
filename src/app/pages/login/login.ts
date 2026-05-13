import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { auth } from '../../../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // Redirect to board if already logged in
    onAuthStateChanged(auth, (user) => {
      if (user) this.router.navigate(['/board']);
    });
  }

  async login() {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      console.log("Logged in:", userCredential.user);
      this.router.navigate(['/board']);
    } catch (error: any) {
      alert(error.message);
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Google login:", result.user);
      this.router.navigate(['/board']);
    } catch (error: any) {
      alert(error.message);
    }
  }

  async signup() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, this.email, this.password);
    alert("Account created!");
    this.router.navigate(['/board']); // ✅ auto login
  } catch (error: any) {
    alert(error.message);
  }
}
}