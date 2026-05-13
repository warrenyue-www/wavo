using UnityEngine;

public class AsteroidDrifter : MonoBehaviour
{
    public int health = 50;
    public int contactDamage = 18;
    public float spinSpeed = 80f;
    public Vector2 velocity;

    private void Update()
    {
        transform.position += (Vector3)(velocity * Time.deltaTime);
        transform.Rotate(0f, 0f, spinSpeed * Time.deltaTime);
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.collider.TryGetComponent(out PlayerController controller))
        {
            controller.TakeDamage(contactDamage);
            velocity *= -0.6f;
        }
    }

    public void TakeDamage(int amount)
    {
        health -= amount;
        if (health <= 0)
        {
            GameManager.Instance.AsteroidDestroyed(transform.position);
            Destroy(gameObject);
        }
    }
}
